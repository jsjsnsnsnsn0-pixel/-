import parser from '@babel/eslint-parser';
import hooks from 'eslint-plugin-react-hooks';
export default [{
  files: ['src/**/*.{ts,tsx}'],
  languageOptions: {parser, parserOptions: {requireConfigFile: false, babelOptions: {plugins: [['@babel/plugin-syntax-typescript', {isTSX: true}]]}}},
  plugins: {'react-hooks': hooks},
  rules: {'react-hooks/rules-of-hooks': 'error', 'no-unreachable': 'error', 'no-constant-binary-expression': 'error'},
}];
