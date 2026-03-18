
# © 2023 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
# This AWS Content is provided subject to the terms of the AWS Customer Agreement available at
# http: // aws.amazon.com/agreement or other written agreement between Customer and either
# Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.
import boto3
import re
from botocore.exceptions import ClientError


# Regex pattern for valid UUID group IDs
UUID_PATTERN = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    re.IGNORECASE
)


def get_identiy_store_id():
    client = boto3.client('sso-admin')
    try:
        response = client.list_instances()
        return response['Instances'][0]['IdentityStoreId']
    except ClientError as e:
        print(e.response['Error']['Message'])


sso_instance = get_identiy_store_id()


def list_idc_group_membership(groupId):
    try:
        client = boto3.client('identitystore')
        p = client.get_paginator('list_group_memberships')
        paginator = p.paginate(IdentityStoreId=sso_instance,
        GroupId=groupId,
        )
        all_groups=[]
        for page in paginator:
            all_groups.extend(page["GroupMemberships"])
        return all_groups
    except ClientError as e:
        print(e.response['Error']['Message'])
        
def handler(event, context):
    
    members = []
    groupIds = event["arguments"]["groupIds"]
    for groupId in groupIds:
        # Validate group ID format to prevent arbitrary group enumeration
        if not groupId or not UUID_PATTERN.match(str(groupId).strip()):
            print(f"Invalid group ID format rejected: {groupId}")
            continue
        members.extend(list_idc_group_membership(groupId))
    return {"members": members}