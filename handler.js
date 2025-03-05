const axios = require('axios');
const sharp = require('sharp');
const { v4: uuidv4 } = require("uuid");
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  endpoint: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
  accessKeyId: process.env.MINIO_ACCESS_KEY,
  secretAccessKey: process.env.MINIO_SECRET_KEY,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});

const BUCKET_NAME = process.env.MINIO_BUCKET;

const dynamoDb = new AWS.DynamoDB.DocumentClient(
  process.env.IS_OFFLINE && {
    region: "localhost",
    endpoint: "http://localhost:8000",
  }
);

const TABLE_NAME = process.env.DYNAMODB_TABLE;

module.exports.generateMeme = async (event) => {
  console.log('Requête reçu:', event);
  const body = JSON.parse(event.body);
  const { imageUrl, topText, bottomText } = body;

  if (!imageUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Image URL requise' }),
    };
  }

  try {
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer',
    });

    console.log('Création du meme...');
    const maxWidth = 1200;
    let image = sharp(response.data);
    
    const metadata = await image.metadata();
    const width = metadata.width;
    
    if (width > maxWidth) {
      image = image.resize(maxWidth);
    }

    const memeImage = await sharp(response.data)
    .composite([
      {
        input: Buffer.from(`
          <svg width="100%" height="100%">
            <text x="50%" y="90%" font-size="100" text-anchor="middle" fill="white" font-family="Arial, sans-serif">${topText}</text>
          </svg>`),
        top: 30,
        left: 10
      },
      {
        input: Buffer.from(`
          <svg width="100%" height="100%">
            <text x="50%" y="90%" font-size="100" text-anchor="middle" fill="white" font-family="Arial, sans-serif">${bottomText}</text>
          </svg>`),
        top: 500,
        left: 10
      }
    ])
    .toBuffer();

    console.log('Meme créé. Envoi vers s3...'); 

    const newImageName = `generated-${Date.now()}-${imageUrl.split('/').pop()}`;
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: newImageName,
      Body: memeImage,
      ContentType: 'image/png',
    };

    await s3.putObject(uploadParams).promise();
    console.log(`http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET_NAME}/${newImageName}`)

    const url = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET_NAME}/${newImageName}`
    const key = uuidv4().slice(0, 8);
  
    const params = {
      TableName: TABLE_NAME,
      Item: {
        key,
        url,
        createdAt: new Date().toISOString(),
      },
    };
  
    await dynamoDb.put(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Meme généré avec succès',
        memeUrl: url,
      }),
    };
  } catch (error) {
    console.error('Erreur.', error.message || error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erreur durant la génération du meme', error: error.message || error }),
    };
  }
};


exports.listMemesUrl = async (event) => {
  const params = {
    TableName: TABLE_NAME,
  };

  const { Items } = await dynamoDb.scan(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(Items),
  };
};