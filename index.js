const AWS = require('aws-sdk');
const { program } = require('commander');
const fs = require('fs');

require('dotenv').config();

const s3 = new AWS.S3();

// Lists all files 
async function listFiles(bucket, prefix = '') {
    try {
        const params = {
            Bucket: bucket,
            Prefix: prefix
        };
        const data = await s3.listObjectsV2(params).promise();
        if (data.Contents.length === 0) {
            console.log('No files found');
        } else {
            data.Contents.forEach(item => console.log(item.Key));
        }
    } catch (err) {
        console.error('Error listing files:', err);
    }
}

// Lists files with regex filter
async function listFilesWithFilter(bucket, prefix = '', filterRegex = '') {
    try {
        const params = {
            Bucket: bucket,
            Prefix: prefix
        };
        const data = await s3.listObjectsV2(params).promise();
        if (data.Contents.length === 0) {
            console.log('No files found');
        } else {
            const regex = new RegExp(filterRegex);
            data.Contents
                .map(item => item.Key)
                .filter(key => regex.test(key))
                .forEach(key => console.log(key));
        }
    } catch (err) {
        console.error('Error listing files with filter:', err);
    }
}

// Uploads file
async function uploadFile(bucket, filePath, key){
    const fileContent = fs.readFileSync(filePath);

    const params = {
        Bucket: bucket,
        Key: key,
        Body: fileContent
    };

    try {
        const data = await s3.upload(params).promise();
        console.log('File uploaded successfully:', data.Location);
    }
    catch (err){
        console.error('Error uploading file:', err);
    }
}

// Deletes files with regex filter
async function deleteFilesWithFilter(bucket, prefix = '', filterRegex = '') {
    try {
        const params = {
            Bucket: bucket,
            Prefix: prefix
        };
        const data = await s3.listObjectsV2(params).promise();
        const regex = new RegExp(filterRegex);

        const deleteParams = {
            Bucket: bucket,
            Delete: {
                Objects: data.Contents
                    .filter(item => regex.test(item.Key))
                    .map(item => ({ Key: item.Key }))
            }
        };

        if (deleteParams.Delete.Objects.length > 0) {
            await s3.deleteObjects(deleteParams).promise();
            console.log('Files deleted successfully.');
        } else {
            console.log('No files match the filter.');
        }
    } catch (err) {
        console.error('Error deleting files with filter:', err);
    }
}

// Argument parsing
if (process.argv[2] === 'list') {
    const bucket = process.argv[3];
    const prefix = process.argv[4] || '';
    if (!bucket) {
        console.error('Bucket name is required');
        process.exit(1);
    }
    listFiles(bucket, prefix);
} else if (process.argv[2] === 'list-filter') {
    const bucket = process.argv[3];
    const prefix = process.argv[4] || '';
    const filter = process.argv[5] || '';
    if (!bucket || !filter) {
        console.error('Bucket name and filter are required');
        process.exit(1);
    }
    listFilesWithFilter(bucket, prefix, filter);
} else if (process.argv[2] === 'upload') {
    const bucket = process.argv[3];
    const filePath = process.argv[4];
    const key = process.argv[5];
    if (!bucket || !filePath || !key) {
        console.error('Bucket name, file path, and key are required');
        process.exit(1);
    }
    uploadFile(bucket, filePath, key);
} else if (process.argv[2] === 'delete') {
    const bucket = process.argv[3];
    const prefix = process.argv[4] || '';
    const filter = process.argv[5] || '';
    if (!bucket || !filter) {
        console.error('Bucket name and filter are required');
        process.exit(1);
    }
    deleteFilesWithFilter(bucket, prefix, filter);
} else {
    console.log('Usage:');
    console.log('  node index.js list <bucket-name> [prefix]');
    console.log('  node index.js list-filter <bucket-name> [prefix] <filter>');
    console.log('  node index.js upload <bucket-name> <file-path> <key>');
    console.log('  node index.js delete <bucket-name> [prefix] <filter>');
}