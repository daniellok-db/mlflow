/**
 * NOTE: this code file was automatically migrated to TypeScript using ts-migrate and
 * may contain multiple `any` type annotations and `@ts-expect-error` directives.
 * If possible, please improve types while making changes to this file. If the type
 * annotations are already looking good, please remove this comment.
 */

import React from 'react';
import ReactDOM from 'react-dom';

const TestComponent = () => {
  return <div>Testing a new component</div>;
};

ReactDOM.render(<TestComponent />, document.getElementById('root'));

const windowOnError = (message: any, source: any, lineno: any, colno: any, error: any) => {
  // eslint-disable-next-line no-console -- TODO(FEINF-3587)
  console.error(error, message);
  // returning false allows the default handler to fire as well
  return false;
};

window.onerror = windowOnError;
