import js from '@eslint/js';
import ts from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
export default ts.config({ignores:['dist','node_modules','playwright-report','test-results']},js.configs.recommended,...ts.configs.recommended,{files:['src/domain/**/*.{ts,tsx}','src/components/obras/**/*.tsx','src/pages/obras/**/*.tsx','src/layouts/ObrasLayout.tsx','src/router/WorkRouter.tsx'],languageOptions:{globals:{...globals.browser}},plugins:{'react-hooks':hooks},rules:{...hooks.configs.recommended.rules,'@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_',varsIgnorePattern:'^_'}],'react-hooks/exhaustive-deps':'error'}},{files:['*.js'],languageOptions:{globals:{...globals.node}}});
