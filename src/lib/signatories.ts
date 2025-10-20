export type Signatory = {
  pin: string;
  name: string;
  role: string;
};

const SIGNATORY_REGISTRY: Signatory[] = [
  { pin: "9033", name: "Thomas Kaestner", role: "Production Manager" },
  { pin: "3387", name: "Stephen Phipps", role: "Factory Manager" },
  { pin: "5566", name: "Jayward Severino", role: "Admin" },  
  { pin: "1204", name: "Jonathan Tagasa", role: "Shift Leader" },
  { pin: "4521", name: "Zeus Guillergan", role: "Production Staff" },
  { pin: "7742", name: "Reny Guerrero", role: "Production Staff" },

];

const REGISTRY_MAP = new Map(SIGNATORY_REGISTRY.map((entry) => [entry.pin, entry]));

export function resolveSignatory(pin: string): Signatory | undefined {
  return REGISTRY_MAP.get(pin);
}

export function listSignatories(): Signatory[] {
  return [...SIGNATORY_REGISTRY];
}