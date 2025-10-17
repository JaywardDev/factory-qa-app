import { useEffect, useState } from "react";
import ProjectList from "./components/ProjectList";
import CategoryBoard from "./components/CategoryBoard";
import ComponentList from "./components/ComponentList";
import ExportButton from "./components/ExportButton";
import ImportProjectButton from "./components/ImportProjectButton";
import Modal from "./components/Modal";
import AdminImportPanel from "./components/AdminImportPanel";
import { seedIfEmpty } from "./lib/seed";
import type { Project, Panel, PanelType } from "./lib/types";
import "./index.css";
import { resolveTemplateForm } from "./forms/registry";

// main app component with three levels of navigation flow
export default function App() {
  const [dataReady, setDataReady] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentType, setCurrentType] = useState<PanelType | null>(null);
  const [currentComp, setCurrentComp] = useState<Panel | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);  

  // Route the selected component through the template registry so each modal
  // renders the correct Access-specific QA form.
  const ActiveTemplateForm = currentComp
    ? resolveTemplateForm(currentComp.template_id)
    : null;

  // seed initial data if db is empty
  useEffect(() => {
    let active = true;

    seedIfEmpty()
      .then((seeded) => {
        if (seeded) {
          setDataVersion((value) => value + 1);
        }
      })    
      .catch((error) => {
        console.error("Failed to seed initial data", error);
      })
      .finally(() => {
        if (active) {
          setDataReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleDataImported = () => {
    setCurrentComp(null);
    setCurrentType(null);
    setCurrentProject(null);
    setDataReady(true);
    setDataVersion((value) => value + 1);
  };  

  const handleBackToProjects = () => {
    setCurrentComp(null);
    setCurrentType(null);
    setCurrentProject(null);
  };
  
  // main render and navigation flow
  return (
    <div className="app">
      <header className="toolbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <span className="brand-mark__frame">
              <span className="brand-mark__initials">HE</span>
            </span>
          </div>
          <div className="brand-copy">
            <span className="brand-name">Hector Egger NZ</span>
            <span className="brand-tagline">Factory QA Sheet</span>
          </div>
        </div>
        <div className="toolbar-actions">
          <ImportProjectButton onClick={() => setShowImport(true)} />
          <ExportButton />
        </div>
      </header>

      {!currentProject && (
        <ProjectList
          onPick={setCurrentProject}
          ready={dataReady}
          refreshKey={dataVersion}
        />
      )}

      {currentProject && !currentType && (
        <CategoryBoard
          project={currentProject}
          onPickCategory={setCurrentType}
          onBack={handleBackToProjects}
        />
      )}

      {currentProject && currentType && (
        <ComponentList
          project={currentProject}
          type={currentType}
          onPickComponent={setCurrentComp}
          onBack={()=> setCurrentType(null)}
        />
      )}

      <Modal open={!!currentComp} onClose={()=> setCurrentComp(null)}>
        <div className="modal-head">
          <h2 style={{margin:0}}>
            {currentComp
              ? `${currentComp.group_code} • ${currentComp.panel_id ?? currentComp.id}`
              : 'QA Form'}
          </h2>
          <button className="btn" onClick={()=> setCurrentComp(null)}>✕ Close</button>
        </div>
        {ActiveTemplateForm && currentComp && (
          <ActiveTemplateForm component={currentComp} />
        )}
      </Modal>

      <Modal open={showImport} onClose={() => setShowImport(false)}>
        <AdminImportPanel
          onClose={() => setShowImport(false)}
          onImported={handleDataImported}
        />
      </Modal>

      <div className="app-hint">Projects → Categories → Components → QA (modal)</div>
    </div>
  );
}
