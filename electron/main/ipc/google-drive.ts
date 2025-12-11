/**
 * Google Drive IPC Handlers
 * 
 * Handles Google Drive OAuth 2.0 and API operations:
 * - Authentication flow
 * - File listing
 * - File moving
 * - Folder creation
 */

import { ipcMain, shell, BrowserWindow } from 'electron';
import { google, drive_v3 } from 'googleapis';
import Store from 'electron-store';
import { IPC_CHANNELS } from '../../../src/services/config';
import { DriveFile, DriveAuthState, DriveListOptions } from '../../../src/domain/types/drive';

// Persistent store for tokens
const store = new Store({
  name: 'google-drive-auth',
  encryptionKey: 'smart-file-organizer-v1', // Basic encryption
});

// Google OAuth configuration
// Users should create their own credentials at https://console.cloud.google.com
const OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: 'http://localhost:8085/oauth2callback',
  scopes: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
};

// OAuth client instance
let oauth2Client: ReturnType<typeof createOAuthClient> | null = null;
let driveClient: drive_v3.Drive | null = null;

/**
 * Create OAuth2 client.
 */
function createOAuthClient() {
  return new google.auth.OAuth2(
    OAUTH_CONFIG.clientId,
    OAUTH_CONFIG.clientSecret,
    OAUTH_CONFIG.redirectUri
  );
}

/**
 * Initialize OAuth client with stored tokens.
 */
function initializeOAuthClient(): boolean {
  try {
    const tokens = store.get('tokens') as any;
    if (tokens) {
      oauth2Client = createOAuthClient();
      oauth2Client.setCredentials(tokens);
      driveClient = google.drive({ version: 'v3', auth: oauth2Client });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error initializing OAuth client:', error);
    return false;
  }
}

/**
 * Register all Google Drive IPC handlers.
 */
export function registerGoogleDriveHandlers(): void {
  // Try to restore previous session
  initializeOAuthClient();

  // Start OAuth flow
  ipcMain.handle(IPC_CHANNELS.DRIVE_AUTH, async () => {
    try {
      // Check if credentials are configured
      if (!OAUTH_CONFIG.clientId || !OAUTH_CONFIG.clientSecret) {
        return {
          success: false,
          error: 'Google API credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
        };
      }

      oauth2Client = createOAuthClient();
      
      // Generate auth URL
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: OAUTH_CONFIG.scopes,
        prompt: 'consent',
      });

      // Open auth URL in browser
      await shell.openExternal(authUrl);

      // Start local server to receive callback
      const code = await waitForAuthCallback();
      
      if (!code) {
        return { success: false, error: 'Authentication cancelled' };
      }

      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      
      // Store tokens
      store.set('tokens', tokens);

      // Get user info
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      store.set('userInfo', userInfo.data);

      // Initialize drive client
      driveClient = google.drive({ version: 'v3', auth: oauth2Client });

      return { success: true };
    } catch (error: any) {
      console.error('OAuth error:', error);
      return { success: false, error: error.message };
    }
  });

  // Logout
  ipcMain.handle(IPC_CHANNELS.DRIVE_LOGOUT, async () => {
    try {
      if (oauth2Client) {
        await oauth2Client.revokeCredentials();
      }
    } catch (error) {
      // Ignore revocation errors
    }
    
    store.delete('tokens');
    store.delete('userInfo');
    oauth2Client = null;
    driveClient = null;
  });

  // Get auth state
  ipcMain.handle(IPC_CHANNELS.DRIVE_GET_AUTH_STATE, async (): Promise<DriveAuthState> => {
    const tokens = store.get('tokens') as any;
    const userInfo = store.get('userInfo') as any;

    if (!tokens) {
      return { isAuthenticated: false };
    }

    return {
      isAuthenticated: true,
      email: userInfo?.email,
      displayName: userInfo?.name,
      photoUrl: userInfo?.picture,
      tokenExpiresAt: tokens?.expiry_date ? new Date(tokens.expiry_date) : undefined,
    };
  });

  // List files
  ipcMain.handle(
    IPC_CHANNELS.DRIVE_LIST_FILES,
    async (_, options: DriveListOptions) => {
      if (!driveClient) {
        throw new Error('Not authenticated with Google Drive');
      }

      try {
        const { folderId = 'root', pageSize = 100, pageToken, query } = options;

        let q = `'${folderId}' in parents and trashed = false`;
        if (query) {
          q += ` and ${query}`;
        }

        const response = await driveClient.files.list({
          q,
          pageSize,
          pageToken,
          fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, parents, webViewLink, iconLink, owners)',
          orderBy: 'folder, name',
        });

        const files: DriveFile[] = (response.data.files || []).map((file) => ({
          id: file.id!,
          name: file.name!,
          mimeType: file.mimeType!,
          size: file.size ? parseInt(file.size) : undefined,
          createdTime: new Date(file.createdTime!),
          modifiedTime: new Date(file.modifiedTime!),
          parents: file.parents || [],
          path: file.name!, // TODO: Build full path
          isFolder: file.mimeType === 'application/vnd.google-apps.folder',
          webViewLink: file.webViewLink,
          iconLink: file.iconLink,
          owners: file.owners?.map((o) => ({
            displayName: o.displayName!,
            emailAddress: o.emailAddress!,
          })),
        }));

        return {
          files,
          nextPageToken: response.data.nextPageToken,
          hasMore: !!response.data.nextPageToken,
        };
      } catch (error: any) {
        console.error('Error listing Drive files:', error);
        throw error;
      }
    }
  );

  // Move file
  ipcMain.handle(
    IPC_CHANNELS.DRIVE_MOVE_FILE,
    async (_, options: { fileId: string; currentParentId: string; newParentId: string; newName?: string }) => {
      if (!driveClient) {
        throw new Error('Not authenticated with Google Drive');
      }

      try {
        const updateData: any = {};
        if (options.newName) {
          updateData.name = options.newName;
        }

        const response = await driveClient.files.update({
          fileId: options.fileId,
          addParents: options.newParentId,
          removeParents: options.currentParentId,
          requestBody: updateData,
          fields: 'id, name, mimeType, parents',
        });

        return { success: true, file: response.data };
      } catch (error: any) {
        console.error('Error moving Drive file:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Create folder
  ipcMain.handle(
    IPC_CHANNELS.DRIVE_CREATE_FOLDER,
    async (_, name: string, parentId?: string) => {
      if (!driveClient) {
        throw new Error('Not authenticated with Google Drive');
      }

      try {
        const response = await driveClient.files.create({
          requestBody: {
            name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentId ? [parentId] : undefined,
          },
          fields: 'id, name, mimeType, parents',
        });

        return { success: true, folder: response.data };
      } catch (error: any) {
        console.error('Error creating Drive folder:', error);
        return { success: false, error: error.message };
      }
    }
  );
}

/**
 * Wait for OAuth callback on localhost.
 * Returns the authorization code.
 */
async function waitForAuthCallback(): Promise<string | null> {
  return new Promise((resolve) => {
    const http = require('http');
    const url = require('url');

    const server = http.createServer((req: any, res: any) => {
      const query = url.parse(req.url, true).query;
      
      if (query.code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0f172a; color: white;">
              <div style="text-align: center;">
                <h1>✅ Authentication Successful!</h1>
                <p>You can close this window and return to Smart File Organizer.</p>
              </div>
            </body>
          </html>
        `);
        server.close();
        resolve(query.code);
      } else if (query.error) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0f172a; color: white;">
              <div style="text-align: center;">
                <h1>❌ Authentication Failed</h1>
                <p>Error: ${query.error}</p>
              </div>
            </body>
          </html>
        `);
        server.close();
        resolve(null);
      }
    });

    server.listen(8085, () => {
      console.log('OAuth callback server listening on port 8085');
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      resolve(null);
    }, 5 * 60 * 1000);
  });
}
