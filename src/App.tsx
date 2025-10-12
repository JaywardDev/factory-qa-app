import { useEffect, useState } from "react";
import ProjectList from "./components/ProjectList";
import CategoryBoard from "./components/CategoryBoard";
import ComponentList from "./components/ComponentList";
import ExportButton from "./components/ExportButton";
import Modal from "./components/Modal";
import { seedIfEmpty } from "./lib/seed";
import type { Project, Component as Comp, ComponentType } from "./lib/types";
import "./index.css";
import {
  DEFAULT_TEMPLATE_FORM,
  TEMPLATE_FORM_REGISTRY,
} from "./forms/registry";

// main app component with three levels of navigation flow
export default function App() {
  const [dataReady, setDataReady] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentType, setCurrentType] = useState<ComponentType | null>(null);
  const [currentComp, setCurrentComp] = useState<Comp | null>(null);

  // Route the selected component through the template registry so each modal
  // renders the correct Access-specific QA form.
  const ActiveTemplateForm = currentComp
    ? currentComp.template_id
      ? TEMPLATE_FORM_REGISTRY[currentComp.template_id] ?? DEFAULT_TEMPLATE_FORM
      : DEFAULT_TEMPLATE_FORM
    : null;

  // seed initial data if db is empty
  useEffect(() => {
    let active = true;

    seedIfEmpty()
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
        <ExportButton />
      </header>

      {!currentProject && (
        <ProjectList onPick={setCurrentProject} ready={dataReady} />
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
            {currentComp ? `${currentComp.type.toUpperCase()} ${currentComp.label}` : 'QA Form'}
          </h2>
          <button className="btn" onClick={()=> setCurrentComp(null)}>✕ Close</button>
        </div>
        {ActiveTemplateForm && currentComp && (
          <ActiveTemplateForm component={currentComp} />
        )}
      </Modal>

      <div className="app-hint">Projects → Categories → Components → QA (modal)</div>
    </div>
  );
}
