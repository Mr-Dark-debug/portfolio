import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
const config = [...nextVitals,...nextTypescript,{ignores:['.next/**','node_modules/**','public/**','test-results/**','playwright-report/**','scripts/work/**']},{rules:{'@typescript-eslint/no-explicit-any':'off','@typescript-eslint/no-unused-vars':'off','react-hooks/set-state-in-effect':'off','react-hooks/purity':'off','react-hooks/refs':'off','react-hooks/immutability':'off','react-hooks/preserve-manual-memoization':'off','react-hooks/exhaustive-deps':'warn','prefer-const':'off','react/no-unescaped-entities':'off','@typescript-eslint/ban-ts-comment':'off','react/display-name':'off'}}];

export default config;
