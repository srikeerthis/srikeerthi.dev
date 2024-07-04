---
title: "Building an ETL Pipeline with AWS: From CSV to DynamoDB"
summary: "Developed a simple ETL pipeline using AWS services to transform and load data from a CSV file into a DynamoDB table. This project showcases the integration of AWS S3 and DynamoDB using Python scripts, demonstrating capabilities in cloud-based data processing."
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

## Project Overview
### Objective

The goal was to create an ETL pipeline that extracts data from a CSV file stored in an S3 bucket, transforms it to ensure data integrity, and loads it into a DynamoDB table.

### Steps performed
1. Download Sample File: Obtained a sample CSV file for processing.
2. Create an S3 Bucket: Created an S3 bucket named etlprocess-files to store the CSV file.
3. Upload CSV to S3: Uploaded the CSV file to the S3 bucket using AWS Management Console.
4. Configure IAM Roles and Policies:
    - Created an IAM group etl-process-group with AmazonS3FullAccess and AmazonDynamoDBFullAccess policies.
    - Created an IAM user etl-user, added to the group, and generated access keys.
5. Set Up Environment:
    - Created a .env file with AWS credentials and configuration.
    - Set up a virtual environment and installed boto3, python-dotenv, and pandas.
6. Develop and Run ETL Script:
    - Wrote main.py to extract data from S3, transform it, and load it into DynamoDB.
    - Ran the script to perform the ETL process.
7. Retrieve Data from DynamoDB:
    - Wrote view_table.py to scan and retrieve data from the DynamoDB table.
    - Ran the script to display the data.

## Skills Demonstrated

- AWS Cloud Services (S3, DynamoDB)
- Python Programming
- Data Processing and Transformation
- ETL Pipeline Development
- Working with IAM Policies and Roles

## Conclusion

This project successfully demonstrated the creation of a cloud-based ETL pipeline using AWS services. The integration of S3 and DynamoDB with Python scripting provided a robust solution for data processing and management. This project highlights the ability to handle scalable and efficient data processing tasks in a cloud environment.