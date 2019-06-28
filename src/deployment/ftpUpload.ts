import Client from 'ftp';
import fs from 'fs';
import path from 'path';

function uploadDirRecursively(
  ftpClient: Client,
  sourcePath: string[] | string,
  destPath: string
): Promise<any> {
  if (Array.isArray(sourcePath)) {
    return Promise.all(sourcePath.map(p => uploadDirRecursively(ftpClient, p, destPath)));
  }

  const entries = fs.readdirSync(sourcePath, { withFileTypes: true });

  return Promise.all(
    entries.map(entry => {
      const sourceSubPath = path.join(sourcePath, entry.name);
      const destSubPath = path.join(destPath, entry.name);

      if (entry.isDirectory()) {
        return new Promise((resolve, reject) => {
          ftpClient.mkdir(destSubPath, err => {
            if (err) reject(err);
            else resolve();
          });
        })
          .then(() => console.log(`Created dir: ${destSubPath}`))
          .then(() => uploadDirRecursively(ftpClient, sourceSubPath, destSubPath));
      }

      if (entry.isFile()) {
        return new Promise((resolve, reject) => {
          ftpClient.put(sourceSubPath, destSubPath, err => {
            if (err) reject(err);
            else resolve();
          });
        }).then(() =>
          console.log(
            `Uploaded file: ${destSubPath} from ${path.relative(path.resolve('./'), sourceSubPath)}`
          )
        );
      }

      return Promise.resolve();
    })
  );
}

async function cleanAndUpload(
  ftpClient: Client,
  sourcePath: string[] | string,
  destPath: string
): Promise<any> {
  console.time('Done in');
  try {
    const list = await new Promise<Client.ListingElement[]>((resolve, reject) => {
      ftpClient.list(destPath, (err, ar) => {
        if (err) reject(err);
        else resolve(ar);
      });
    });

    // delete dir content
    await Promise.all(
      list.map(entry =>
        new Promise((resolve, reject) => {
          if (entry.type === 'd') {
            ftpClient.rmdir(path.join(destPath, entry.name), true, err => {
              if (err) reject(err);
              else resolve();
            });
          } else {
            ftpClient.delete(path.join(destPath, entry.name), err => {
              if (err) reject(err);
              else resolve();
            });
          }
        }).then(() => console.log(`'${path.join(destPath, entry.name)}' is deleted.`))
      )
    );

    // upload
    await uploadDirRecursively(ftpClient, sourcePath, destPath);
  } catch (ex) {
    console.error(ex);
  } finally {
    console.timeEnd('Done in');
  }
}

export interface FtpUploadOptions extends Client.Options {
  sourcePath: string[] | string;
  destPath: string;
}

export default function ftpUpload({
  sourcePath,
  destPath,
  ...connectOptions
}: FtpUploadOptions): Promise<void> {
  const client = new Client();

  console.log('Start uploading...');
  client.connect(connectOptions);

  return new Promise((resolve, reject) => {
    client.on('ready', () => {
      cleanAndUpload(client, sourcePath, destPath)
        .finally(() => client.end())
        .then(resolve)
        .catch(reject);
    });
  });
}
