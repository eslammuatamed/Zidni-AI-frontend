module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
    extraFileExtensions: ['.vue']
  },
  plugins: ['@typescript-eslint', 'vue'],
  rules: {
    'no-restricted-properties': [
      'error',
      {
        object: 'tenantStore',
        property: 'branding',
        message: 'Use useFeaturesStore().hasFeature instead of tenantStore.branding.flags.'
      }
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector: "MemberExpression[object.property.name='branding'][property.name='flags']",
        message: 'Use useFeaturesStore().hasFeature for feature gating.'
      },
      {
        selector: "CallExpression[callee.name='hasFeature'] Literal",
        message: 'Use FEATURE.<code> constants when checking feature access.'
      },
      {
        selector: "CallExpression[callee.property.name='hasFeature'] Literal",
        message: 'Use FEATURE.<code> constants when checking feature access.'
      },
      {
        selector: "Property[key.name='requiresFeature'] Literal",
        message: 'Reference FEATURE.<code> for route gating.'
      },
      {
        selector: "CallExpression[callee.property.name='getEntitlement'] Literal",
        message: 'Use ENTITLEMENT.<key> constants when reading entitlements.'
      }
    ]
  }
};
