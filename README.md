# Meme Generator - Serverless Application - GIRARD Lucas & BREVET Noa

## Description du Projet
Ce projet est une application serverless qui permet de générer et visualiser des memes en ajoutant du texte à des images. L'application utilise AWS Lambda, API Gateway, DynamoDB et S3 via Minio.

## Fonctionnalités
Création de mèmes en ajoutant du texte sur des images
Stockage des images dans S3 avec accès public
Stockage des métadonnées dans DynamoDB
Liste de tous les mèmes générés

## Prérequis
- Node.js (v18)
- Serverless Framework (npm install -g serverless)
- Docker (pour exécuter DynamoDB)
- S3 (via MINIO)
- Sharp : pour modifier une image en lui ajoutant du texte (npm i sharp)

## Installation et Configuration
Cloner le dépôt

Installer les dépendances avec: \
```npm install```

Configurer Minio en spécifiant un bucket (MINIO_BUCKET), une clé secrète (MINIO_SECRET_KEY) et une clé d'accès (MINIO_ACCESS_KEY)

Démarrer l'environnement local: \
```serverless offline start --reloadHandler```

Un serveur API Gateway local sur http://localhost:3000 \
Un émulateur DynamoDB local sur http://localhost:8000 \
Un serveur S3 local avec Minio sur http://localhost:9000

## Site web
Utiliser le fichier index.html pour accéder à l'interface visuelle.

## Points d'entrée API
- Création d'un meme - POST : /dev/generate-meme
- Lister tous les memes - GET : /dev/list-memes-url    

## Exemples d'appel
- Création d'un même : http://localhost:3000/dev/generate-meme    
+ Payload :
````json
{
  "imageUrl": "Url d'image",
  "topText": "Salut",
  "bottomText": "refrf"
}
````
- Liste des memes : http://localhost:3000/dev/list-memes-url    
