import { body, param, validationResult } from 'express-validator/check';
import { sanitizeBody } from 'express-validator/filter';

const validateLogin = [
  body('userid')
    .exists()
    .withMessage('User ID must be provided.')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positve number from 1'),
  body('password')
    .exists()
    .withMessage('User password must be provided.')
    .isLength({ min: 5 })
    .withMessage('Password should be atleast 5 characters')
];

const validateSignup = [
  sanitizeBody('name').customSanitizer(value => value.replace(/\s\s+/g, ' ').trim()),
  body('name')
    .isLength({ min: 2 })
    .withMessage('Staff name must be atleast 2 letters long'),
  body('password')
    .isLength({ min: 5 })
    .withMessage('Staff password should have atleast 5 characters'),
  sanitizeBody('role').customSanitizer(value => value[0].toUpperCase() + value.slice(1)),
  body('role')
    .isIn(['Admin', 'Attendant'])
    .withMessage('User can either be an Admin or Attendant')
];

const validateUserUpdate = [
  param('userid')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positve integer from 1'),
  validateSignup[0],
  validateSignup[1],
  validateSignup[2],
  validateSignup[3],
  body('role')
    .isIn(['Admin', 'Attendant', 'Owner'])
    .withMessage('User can either be an Admin, an Attendant or Owner')
];

const validateUserDelete = [validateUserUpdate[0]];

const validateNewCategory = [
  sanitizeBody('name').customSanitizer(value =>
    value
      .toLowerCase()
      .split(' ')
      .map(s => s.charAt(0).toUpperCase() + s.substring(1))
      .join(' ')
      .replace(/([^a-zA-z\s])/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
  ),
  body('name')
    .isLength({ min: 2 })
    .withMessage('Category name must be atleast 2 letters long')
];

const validateUpdateCategory = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positve integer from 1'),
  validateNewCategory[0],
  validateNewCategory[1]
];

const validateCategoryId = [validateUpdateCategory[0]];

const validateProductId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positve integer from 1')
];

const validateSaleId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Sales Order ID must be a positve integer from 1')
];

const validateNewProduct = [
  body('imgUrl')
    .custom(imageUrl => {
      const checkUrl = /(http(s?):(\/){2})([^/])([/.\w\s-])*\.(?:jpg|gif|png)/g;
      return checkUrl.test(imageUrl);
    })
    .withMessage('Product image input should be a valid image url'),
  body('name')
    .isLength({ min: 2 })
    .withMessage('Product name must be atlease 2 letters long'),
  body('categoryid')
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive number from 1'),
  body('price')
    .isFloat({ min: 1.0 })
    .withMessage('Product price must be decimal number of 1.0 or more'),
  body('qty')
    .isNumeric({ min: 1 })
    .withMessage('Product qty must be a positive number from 1'),
  body('imgUrl')
    .exists()
    .withMessage('Product Image must be provided.'),
  sanitizeBody('name').customSanitizer(value => value.replace(/\s{2,}/g, ' ').trim()),
  body('name')
    .exists()
    .withMessage('Product name must be provided.'),
  body('categoryid')
    .exists()
    .withMessage('Category Id must be provided.'),
  body('price')
    .exists()
    .withMessage('Product price must  be provided.'),
  body('qty')
    .exists()
    .withMessage('Product quantity must be provided.')
];

const validateProductUpdate = [
  validateProductId[0],
  validateNewProduct[0].optional(),
  validateNewProduct[1].optional(),
  validateNewProduct[2].exists().withMessage('Category ID must be provided.'),
  validateNewProduct[3].optional(),
  validateNewProduct[4].optional()
];

const validateNewSale = [
  body('products', 'Products must exists').exists(),
  body('products', 'Products must be specified in the right format').isArray(),
  body('products', 'Should contain atleast 1 product entry').isLength({ min: 1 }),
  body('products.*.id', 'Product Id must be a a number from 1').isInt({ min: 1 }),
  body('products.*.qty', 'Product Qty must be a number from 1').isInt({ min: 1 })
];

const validationHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ error: errors.array().map(error => error.msg) });
  } else {
    next();
  }
};

const validations = {
  validateLogin,
  validateSignup,
  validateUserUpdate,
  validateUserDelete,
  validateNewCategory,
  validateUpdateCategory,
  validateCategoryId,
  validateSaleId,
  validateNewSale,
  validateProductUpdate,
  validateNewProduct,
  validateProductId,
  validationHandler
};
export default validations;
