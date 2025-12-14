import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
// @ts-ignore - Ignoring TS warning because store.js is JavaScript
import { store } from '@/design-tool/redux/store';
// @ts-ignore
import EditorPanel from '@/design-tool/pages/Editor';
import SavedDesigns from '@/design-tool/'
import { VlyToolbar } from '../../vly-toolbar-readonly'; // Optional: if you want the header

export default function DesignEditorPage() {
  return (
    // We isolate the Redux store here so it doesn't conflict with the rest of the app
    <Provider store={store}>
      <div className="w-full h-screen overflow-hidden bg-white">
        {/* You can add a back button or header here if needed */}
        <EditorPanel />
      </div>
    </Provider>
  );
}