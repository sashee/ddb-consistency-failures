import {DynamoDBClient, GetItemCommand, paginateScan, paginateQuery, UpdateItemCommand, PutItemCommand, QueryCommand, TransactWriteItemsCommand, DeleteItemCommand} from "@aws-sdk/client-dynamodb";
import crypto from "node:crypto";

const dynamodb = new DynamoDBClient();

export const handler = async (event) => {
	const createCouponPath = /^\/create$/;
	const applyCouponPath = /^\/apply\/(?<coupon>[^/]*)$/;
	const applyCouponSafePath = /^\/apply_safe\/(?<coupon>[^/]*)$/;

	if (event.requestContext.http.path.match(createCouponPath)) {
		const coupon = crypto.randomUUID();
		await dynamodb.send(new PutItemCommand({
			TableName: process.env.TABLE,
			Item: {
				coupon: {
					S: coupon,
				},
				used: {
					BOOL: false,
				},
			},
		}));

		return {
			statusCode: 200,
			headers: {
				"Content-Type": "text/json",
			},
			body: JSON.stringify({
				coupon,
			}),
		};
	} else if (event.requestContext.http.path.match(applyCouponPath)) {
		const {coupon} = event.requestContext.http.path.match(applyCouponPath).groups;

		const item = await dynamodb.send(new GetItemCommand({
			TableName: process.env.TABLE,
			Key: {
				coupon: {
					S: coupon,
				},
			},
		}));
		if (item.Item?.used?.BOOL === false) {
			await dynamodb.send(new UpdateItemCommand({
				TableName: process.env.TABLE,
				Key: {
					coupon: {S: coupon}
				},
				UpdateExpression: "SET #used = :used",
				ExpressionAttributeNames: {
					"#used": "used",
				},
				ExpressionAttributeValues: {
					":used": {BOOL: true},
				},
			}));
			return {
				statusCode: 200,
			};
		}
		return {
			statusCode: 400,
		};
	} else if (event.requestContext.http.path.match(applyCouponSafePath)) {
		const {coupon} = event.requestContext.http.path.match(applyCouponSafePath).groups;

		const item = await dynamodb.send(new GetItemCommand({
			TableName: process.env.TABLE,
			Key: {
				coupon: {
					S: coupon,
				},
			},
		}));
		if (item.Item?.used?.BOOL === false) {
			await dynamodb.send(new UpdateItemCommand({
				TableName: process.env.TABLE,
				Key: {
					coupon: {S: coupon}
				},
				UpdateExpression: "SET #used = :used",
				ExpressionAttributeNames: {
					"#used": "used",
				},
				ExpressionAttributeValues: {
					":used": {BOOL: true},
					":false": {BOOL: false},
				},
				ConditionExpression: "#used = :false",
			}));
			return {
				statusCode: 200,
			};
		}
		return {
			statusCode: 400,
		};
	}
};

