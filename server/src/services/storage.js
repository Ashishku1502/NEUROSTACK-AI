const config = require('../config');

let client;
const enabled = () => Boolean(config.s3.bucket);

function s3() {
  if (!client) {
    const { S3Client } = require('@aws-sdk/client-s3');
    client = new S3Client({ region: config.s3.region });
  }
  return client;
}

async function save({ key, buffer, contentType }) {
  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  await s3().send(new PutObjectCommand({ Bucket: config.s3.bucket, Key: key, Body: buffer, ContentType: contentType }));
  return key;
}

async function remove(key) {
  const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
  await s3().send(new DeleteObjectCommand({ Bucket: config.s3.bucket, Key: key }));
}

module.exports = { enabled, save, remove };
