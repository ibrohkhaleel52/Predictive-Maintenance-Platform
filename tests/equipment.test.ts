import { describe, it, expect, beforeEach } from "vitest";

// Mock the Clarity functions and types
const mockClarity = {
  tx: {
    sender: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  },
  types: {
    uint: (value: number) => ({ type: "uint", value }),
    principal: (value: string) => ({ type: "principal", value }),
    string: (value: string) => ({ type: "string", value }),
    bool: (value: boolean) => ({ type: "bool", value }),
  },
};

// Mock contract state
let lastEquipmentId = 0;
const equipments = new Map();

// Mock contract calls
const contractCalls = {
  "add-equipment": (type: string, manufacturer: string, installationDate: number) => {
    const equipmentId = ++lastEquipmentId;
    equipments.set(equipmentId, {
      type: mockClarity.types.string(type),
      manufacturer: mockClarity.types.string(manufacturer),
      "installation-date": mockClarity.types.uint(installationDate),
      "health-score": mockClarity.types.uint(100),
      status: mockClarity.types.string("operational"),
    });
    return { success: true, value: mockClarity.types.uint(equipmentId) };
  },
  "update-health-score": (equipmentId: number, newHealthScore: number) => {
    const equipment = equipments.get(equipmentId);
    if (!equipment) {
      return { success: false, error: "err-not-found" };
    }
    if (newHealthScore > 100) {
      return { success: false, error: "err-unauthorized" };
    }
    equipment["health-score"] = mockClarity.types.uint(newHealthScore);
    return { success: true, value: true };
  },
  "update-status": (equipmentId: number, newStatus: string) => {
    const equipment = equipments.get(equipmentId);
    if (!equipment) {
      return { success: false, error: "err-not-found" };
    }
    equipment.status = mockClarity.types.string(newStatus);
    return { success: true, value: true };
  },
  "get-equipment": (equipmentId: number) => {
    const equipment = equipments.get(equipmentId);
    return equipment ? { success: true, value: equipment } : { success: false, error: "err-not-found" };
  },
  "get-equipment-count": () => {
    return { success: true, value: mockClarity.types.uint(lastEquipmentId) };
  },
};

describe("Equipment Contract", () => {
  beforeEach(() => {
    lastEquipmentId = 0;
    equipments.clear();
  });
  
  it("should add new equipment", () => {
    const result = contractCalls["add-equipment"]("Pump", "Acme Inc", 1625097600);
    expect(result.success).toBe(true);
    expect(result.value).toEqual(mockClarity.types.uint(1));
    
    const equipment = contractCalls["get-equipment"](1);
    expect(equipment.success).toBe(true);
    expect(equipment.value.type).toEqual(mockClarity.types.string("Pump"));
    expect(equipment.value.manufacturer).toEqual(mockClarity.types.string("Acme Inc"));
    expect(equipment.value["installation-date"]).toEqual(mockClarity.types.uint(1625097600));
    expect(equipment.value["health-score"]).toEqual(mockClarity.types.uint(100));
    expect(equipment.value.status).toEqual(mockClarity.types.string("operational"));
  });
  
  it("should update equipment health score", () => {
    contractCalls["add-equipment"]("Pump", "Acme Inc", 1625097600);
    const result = contractCalls["update-health-score"](1, 90);
    expect(result.success).toBe(true);
    expect(result.value).toBe(true);
    
    const equipment = contractCalls["get-equipment"](1);
    expect(equipment.success).toBe(true);
    expect(equipment.value["health-score"]).toEqual(mockClarity.types.uint(90));
  });
  
  it("should fail to update health score above 100", () => {
    contractCalls["add-equipment"]("Pump", "Acme Inc", 1625097600);
    const result = contractCalls["update-health-score"](1, 101);
    expect(result.success).toBe(false);
    expect(result.error).toBe("err-unauthorized");
  });
  
  it("should update equipment status", () => {
    contractCalls["add-equipment"]("Pump", "Acme Inc", 1625097600);
    const result = contractCalls["update-status"](1, "maintenance");
    expect(result.success).toBe(true);
    expect(result.value).toBe(true);
    
    const equipment = contractCalls["get-equipment"](1);
    expect(equipment.success).toBe(true);
    expect(equipment.value.status).toEqual(mockClarity.types.string("maintenance"));
  });
  
  it("should fail to get non-existent equipment", () => {
    const result = contractCalls["get-equipment"](999);
    expect(result.success).toBe(false);
    expect(result.error).toBe("err-not-found");
  });
  
  it("should get correct equipment count", () => {
    contractCalls["add-equipment"]("Pump", "Acme Inc", 1625097600);
    contractCalls["add-equipment"]("Valve", "Best Valves", 1625184000);
    const result = contractCalls["get-equipment-count"]();
    expect(result.success).toBe(true);
    expect(result.value).toEqual(mockClarity.types.uint(2));
  });
});
