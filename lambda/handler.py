"""
Lambda S3 Event Processor — Étape 10
Trigger : PUT sur s3://bucket/input/*
Action  : Écrire un fichier output.txt dans s3://bucket/output/
"""

import json
import os
import boto3
from datetime import datetime, timezone


def lambda_handler(event, context):
    s3 = boto3.client("s3")
    bucket_name = os.environ["BUCKET_NAME"]
    output_key = os.environ["OUTPUT_KEY"]

    # Extraire les informations de l'événement S3
    records = event.get("Records", [])
    processed = []

    for record in records:
        source_bucket = record["s3"]["bucket"]["name"]
        source_key = record["s3"]["object"]["key"]
        event_time = record["eventTime"]
        event_type = record["eventName"]
        file_size = record["s3"]["object"].get("size", 0)

        processed.append({
            "bucket": source_bucket,
            "key": source_key,
            "event": event_type,
            "time": event_time,
            "size_bytes": file_size,
        })

        print(f"[Lambda] Fichier reçu : s3://{source_bucket}/{source_key} ({file_size} bytes)")

    # Construire le contenu du fichier de sortie
    timestamp = datetime.now(timezone.utc).isoformat()
    output_content = (
        f"=== Rapport de traitement Lambda ===\n"
        f"Exécuté le : {timestamp}\n"
        f"Nombre d'événements traités : {len(processed)}\n\n"
    )

    for i, item in enumerate(processed, 1):
        output_content += (
            f"--- Événement {i} ---\n"
            f"  Bucket source : {item['bucket']}\n"
            f"  Fichier       : {item['key']}\n"
            f"  Type d'événement : {item['event']}\n"
            f"  Horodatage    : {item['time']}\n"
            f"  Taille        : {item['size_bytes']} bytes\n\n"
        )

    output_content += (
        "=== Conclusion ===\n"
        "S3 peut déclencher des workflows serverless via Lambda.\n"
        "Attention aux permissions IAM excessives sur le rôle Lambda.\n"
    )

    # Écrire le fichier output.txt dans le bucket
    s3.put_object(
        Bucket=bucket_name,
        Key=output_key,
        Body=output_content.encode("utf-8"),
        ContentType="text/plain",
        ServerSideEncryption="AES256",
    )

    print(f"[Lambda] Fichier output écrit : s3://{bucket_name}/{output_key}")

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Traitement réussi",
            "events_processed": len(processed),
            "output_location": f"s3://{bucket_name}/{output_key}",
        }),
    }
