module.exports = {
  printWidth: 150,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  plugins: [require.resolve('@trivago/prettier-plugin-sort-imports')],
  importOrder: ['<THIRD_PARTY_MODULES>', '^@buc/(.*)$', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
