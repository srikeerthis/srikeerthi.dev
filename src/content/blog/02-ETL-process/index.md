---
title: "Building an ETL Pipeline with AWS: From CSV to DynamoDB"
summary: "Learn how to build a simple ETL pipeline using AWS services to transform and load data from a CSV file into a DynamoDB table."
date: "Jul 2 2024"
draft: false
tags:
  - ETL
  - AWS
  - Python
  - S3
  - DynamoDB
  - boto3
  - Data Processing
  - Cloud Computing
---

## Introduction

In the world of data processing, ETL (Extract, Transform, Load) pipelines are fundamental for moving and transforming data from one system to another. In this blog, we will walk you through creating a simple ETL pipeline using AWS services. We will start with a CSV file, upload it to an S3 bucket, process it with a Python script, and store the data in a DynamoDB table.

## Prerequisites

Before we dive into the steps, ensure you have the following:

1. An AWS account.
2. Basic knowledge of Python.
3. AWS CLI installed and configured with your credentials.
4. boto3 and dotenv Python packages installed.

### Step 1: Download Sample File

First, download a sample CSV file that we will use as the source data for our ETL process. This file will contain the data we want to process and store in DynamoDB.

### Step 2: Create an S3 Bucket

#### Create AWS Account and S3 Bucket

1. Create an AWS account if you don't already have one.
2. Create an S3 bucket:

   - Go to the S3 console.
   - Click on "Create bucket".
   - Enter a unique bucket name, for example, etlprocess-files.
   - Choose the region closest to you.
   - Click "Create bucket".

### Step 3: Upload File to S3

Upload your CSV file to the S3 bucket you just created. You can do this through the AWS Management Console or using the AWS CLI.

### Step 4: Configure IAM Roles and Policies

#### Create IAM Group and User

1. Create an IAM Group:

- Go to the IAM console.
- Click "Create group" and give it a name, for example, etl-process-group.
- Attach the following policies:
  - AmazonS3FullAccess
  - AmazonDynamoDBFullAccess
- Click "Create Group".

2. Create an IAM User:

- Go to the IAM console.
- Click "Create user".
- Enter a username, for example, etl-user.
- Select "Programmatic access".
- Add the user to the etl-process-group.
- Click "Next: Permissions" and then "Next: Tags" and "Next: Review".
- Click "Create user" and download the access key and secret key.
  > Note: Store these keys securely as the secret key will only be shown once.

### Step 5: Set Up Your Environment

Create a .env file in your project directory and add the following environment variables:

```
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_DEFAULT_REGION=your-region
BUCKET=etlprocess-files
FILENAME=your-filename.csv
TABLE_NAME=users
```

### Step 6: Install Required Python Packages

Set up a virtual environment and install the required packages:

```
python3 -m venv env
source env/bin/activate
pip install boto3 python-dotenv pandas
```

### Step 7: Create and Run the ETL Script

#### ETL Script

Create a Python script named main.py to perform the ETL process:

```
import boto3
import os
from dotenv import load_dotenv
import pandas as pd
from io import StringIO
from botocore.exceptions import ClientError
from decimal import Decimal

# Load environment variables from .env file
load_dotenv('env.env')

# Initialize S3 client with credentials from environment variables
s3 = boto3.client('s3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_DEFAULT_REGION'))

# Get bucket name and file name from environment variables
bucket_name = os.getenv('BUCKET')
file_name = os.getenv('FILENAME')

# Get the object from S3
data = s3.get_object(Bucket=bucket_name, Key=file_name)
contents = data['Body'].read().decode("utf-8")

# Read the CSV data into a pandas DataFrame
csv_data = StringIO(contents)
df = pd.read_csv(csv_data)

# Filter out rows with NaN or infinity values
df = df.replace([pd.NA, float('inf'), float('-inf')], pd.NA).dropna()

# Convert DataFrame to a list of dictionaries
items = df.to_dict(orient="records")

# Function to convert floats to Decimals
def convert_to_decimal(item):
    for key, value in item.items():
        if isinstance(value, float):
            item[key] = Decimal(str(value))
        elif isinstance(value, list):
            item[key] = [Decimal(str(v)) if isinstance(v, float) else v for v in value]
    return item

# Convert all float values in items to Decimal
items = [convert_to_decimal(item) for item in items]

# Initialize DynamoDB resource with credentials from environment variables
dynamodb = boto3.resource(
    'dynamodb',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_DEFAULT_REGION')
)

# Reference the DynamoDB table using environment variable
table = dynamodb.Table(os.getenv('TABLE_NAME'))

# Store each item in the DynamoDB table
for item in items:
    try:
        table.put_item(Item=item)
        print(f"Item added: {item}")
    except ClientError as e:
        print(f"Error adding item: {e.response['Error']['Message']}")

print("Items processing completed!")
```

Run the script:

```
python3 main.py
```

### Step 8: Retrieve Data from DynamoDB

Create a script named view_table.py to scan and retrieve data from the DynamoDB table:

```
import boto3
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv('env.env')

# Initialize a session using Amazon DynamoDB
dynamodb = boto3.resource(
    'dynamodb',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_DEFAULT_REGION')  # Ensure region is specified
)

# Reference the DynamoDB table
table = dynamodb.Table(os.getenv('TABLE_NAME'))  # Ensure table name matches your DynamoDB table

# Scan the table
response = table.scan()
data = response['Items']

# Print the retrieved data
for item in data:
    print(item)
```

Run the script:

```
python3 view_table.py
```

## Conclusion

In this blog, we've walked through the process of setting up a simple ETL pipeline using AWS services. By leveraging S3 for storage, DynamoDB for a NoSQL database, and Python for scripting, we created a robust solution for processing and managing data. This approach can be extended and scaled to handle more complex data processing tasks.

Feel free to experiment and enhance the pipeline to suit your specific requirements. Happy coding!
