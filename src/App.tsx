import { useEffect, useState } from "react";
import ProjectList from "./components/ProjectList";
import CategoryBoard from "./components/CategoryBoard";
import ComponentList from "./components/ComponentList";
import QAFormEditor from "./components/QAFormEditor";
import ExportButton from "./components/ExportButton";
import Modal from "./components/Modal";
import { seedIfEmpty } from "./lib/seed";
import type { Project, Component as Comp, ComponentType } from "./lib/types";
import "./index.css";

export default function App() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentType, setCurrentType] = useState<ComponentType | null>(null);
  const [currentComp, setCurrentComp] = useState<Comp | null>(null);

  useEffect(() => { seedIfEmpty(); }, []);

  return (
    <div className="app">
      <div className="toolbar">
        <div className="title">Factory QA</div>
        <ExportButton />
      </div>

      {!currentProject && (
        <ProjectList onPick={setCurrentProject} />
      )}

      {currentProject && !currentType && (
        <CategoryBoard
          project={currentProject}
          onPickCategory={setCurrentType}
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
        <QAFormEditor />
      </Modal>

      <div style={{fontSize:12, color:'#64748b', paddingTop:16}}>
        Projects → Categories → Components → QA (modal)
      </div>
    </div>
  );
}
