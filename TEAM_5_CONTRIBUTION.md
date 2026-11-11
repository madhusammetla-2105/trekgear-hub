# Team Member 5 Contribution

## Twist Rule - Tent Size Validation
- Strict tent size validation (2-person, 4-person, 6-person only)
- Validation in middleware (validateTent, validateSearchSize)
- Special error response format with allowedValues array
- Database CHECK constraint enforcement
- 3 mandatory test cases:
  1. Valid size (2-person) -> 201 Created
  2. Invalid size (Other) -> 400 with allowed values list
  3. Valid update (4-person) -> 200 OK
