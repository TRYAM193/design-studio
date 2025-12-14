import { Provider } from 'react-redux';
import { Routes, Route } from 'react-router';
// @ts-ignore
import { store } from '@/design-tool/redux/store';
// @ts-ignore
import EditorPanel from '@/design-tool/pages/Editor';
// @ts-ignore
import SavedDesignsPage from '@/design-tool/pages/SavedDesigns';

export default function DesignEditorPage() {
  return (
    <Provider store={store}>
      <div className="w-full h-screen bg-background overflow-hidden">
        <Routes>
          <Route path="/" element={<EditorPanel />} />
          
          <Route path="/saved-designs" element={<SavedDesignsPage />} />
        </Routes>
      </div>
    </Provider>
  );
}