# Example code to demonstrate DDB inconsistency

## Deploy

* ```terraform init```
* ```terraform apply```

## Usage

```
URL=$(terraform output -raw url) node tester.mjs
```

It will run an "unsafe" and a "safe" test 10 times:

```text
unsafe
[
  [ true, false, false ],
  [ false, false, true ],
  [ false, true, true ],
  [ true, false, false ],
  [ true, true, true ],
  [ false, false, true ],
  [ false, false, true ],
  [ true, true, true ],
  [ true, true, true ],
  [ true, false, false ]
]
safe
[
  [ false, false, true ],
  [ false, true, false ],
  [ true, false, false ],
  [ false, false, true ],
  [ false, true, false ],
  [ false, true, false ],
  [ false, false, true ],
  [ false, false, true ],
  [ false, true, false ],
  [ false, true, false ]
]
```

The rows when there are more than one ```true```s are problematic cases when the coupon could be applied multiple times.

You can see that without an extra condition in the ```UpdateItem``` most of the time applying the same coupon is possible.

## Cleanup

* ```terraform destroy```
