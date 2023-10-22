provider "aws" {
}

resource "aws_dynamodb_table" "coupons" {
  name         = "coupons-${random_id.id.hex}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "coupon"

  attribute {
    name = "coupon"
    type = "S"
  }
}

resource "random_id" "id" {
  byte_length = 8
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "/tmp/${random_id.id.hex}-lambda.zip"
  source {
    content  = file("index.mjs")
    filename = "index.mjs"
  }
}

resource "aws_lambda_function" "signer_lambda" {
  function_name = "signer-${random_id.id.hex}-function"

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  handler = "index.handler"
  runtime = "nodejs18.x"
  role    = aws_iam_role.lambda_exec.arn
  environment {
    variables = {
      TABLE  = aws_dynamodb_table.coupons.id
    }
  }
}

data "aws_iam_policy_document" "lambda_exec_role_policy" {
  statement {
    actions = [
      "dynamodb:Scan",
      "dynamodb:PutItem",
      "dynamodb:GetItem",
			"dynamodb:UpdateItem",
    ]
    resources = [
      aws_dynamodb_table.coupons.arn,
    ]
  }
  statement {
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "arn:aws:logs:*:*:*"
    ]
  }
}

resource "aws_cloudwatch_log_group" "loggroup" {
  name              = "/aws/lambda/${aws_lambda_function.signer_lambda.function_name}"
  retention_in_days = 14
}

resource "aws_iam_role_policy" "lambda_exec_role" {
  role   = aws_iam_role.lambda_exec.id
  policy = data.aws_iam_policy_document.lambda_exec_role_policy.json
}

resource "aws_iam_role" "lambda_exec" {
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
	{
	  "Action": "sts:AssumeRole",
	  "Principal": {
		"Service": "lambda.amazonaws.com"
	  },
	  "Effect": "Allow"
	}
  ]
}
EOF
}

resource "aws_lambda_function_url" "lambda" {
  function_name      = aws_lambda_function.signer_lambda.function_name
  authorization_type = "NONE"
}

output "url" {
  value = aws_lambda_function_url.lambda.function_url
}

