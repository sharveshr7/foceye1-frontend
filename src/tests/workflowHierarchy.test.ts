import { describe, it, expect, beforeEach, vi } from "vitest";
import { patientService } from "@/services/patient.service";
import type { PatientInput } from "@/types/patient";

describe("FOCEYE Clinical Workflow Hierarchy", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    global.fetch = vi.fn().mockRejectedValue(new Error("Offline test environment"));
  });

  it("1 & 2: Registration collects demographics and initial observation without requiring diagnosis or therapy", async () => {
    const newPatientInput: PatientInput = {
      hospitalId: "HOS-001",
      firstName: "John",
      lastName: "Doe",
      age: 28,
      gender: "Male",
      dateOfBirth: "1998-04-12",
      phone: "+1 555-0199",
      email: "john.doe@example.com",
      address: "123 Clinic Way",
      emergencyContact: "Jane Doe (+1 555-0100)",
      medicalHistory: "Mild eye strain with computer use",
      initialObservation: "Bilateral symmetrical pupils, mild conjunctival redness noted, no ptosis",
      assignedDoctor: "Dr. Rachel Evans, MD",
      notes: "Baseline pre-test evaluation",
      status: "Active",
    };

    const patient = await patientService.create(newPatientInput);

    // Verify registration does NOT assign a definitive clinical diagnosis or chosen therapy
    expect(patient.id).toBeDefined();
    expect(patient.firstName).toBe("John");
    expect(patient.initialObservation).toBe("Bilateral symmetrical pupils, mild conjunctival redness noted, no ptosis");
    
    // Status must be EYE_TEST_PENDING
    expect(patient.clinicalStatus).toBe("EYE_TEST_PENDING");
    expect(patient.observedPattern).toBe("");
    expect(patient.recommendedTherapyId).toBe("");
  });

  it("3 & 4: Progresses from EYE_TEST_PENDING to EYE_TEST_COMPLETED and THERAPY_RECOMMENDED", async () => {
    const patient = await patientService.create({
      hospitalId: "HOS-001",
      firstName: "Alice",
      lastName: "Walker",
      age: 12,
      gender: "Female",
      dateOfBirth: "2014-06-15",
      phone: "+1 555-0200",
      email: "alice@example.com",
      address: "456 Health Blvd",
      emergencyContact: "Bob Walker",
      medicalHistory: "Reading fatigue",
      initialObservation: "Slight head tilt when focusing on near targets",
      assignedDoctor: "Dr. Sarah Smith, OD",
      notes: "",
    });

    expect(patient.clinicalStatus).toBe("EYE_TEST_PENDING");

    // Simulate Eye Test Completion
    const afterTest = await patientService.update(patient.id, {
      clinicalStatus: "EYE_TEST_COMPLETED",
      observedPattern: "Reduced horizontal tracking and convergence insufficiency pattern",
    });

    expect(afterTest.clinicalStatus).toBe("EYE_TEST_COMPLETED");
    expect(afterTest.observedPattern).toBe("Reduced horizontal tracking and convergence insufficiency pattern");

    // Simulate AI Analysis & Prescription
    const afterAI = await patientService.update(patient.id, {
      clinicalStatus: "THERAPY_RECOMMENDED",
      recommendedTherapyId: "convergence-pushup",
    });

    expect(afterAI.clinicalStatus).toBe("THERAPY_RECOMMENDED");
    expect(afterAI.recommendedTherapyId).toBe("convergence-pushup");

    // Simulate Therapy Session Completion
    const afterTherapy = await patientService.update(patient.id, {
      clinicalStatus: "THERAPY_COMPLETED",
    });

    expect(afterTherapy.clinicalStatus).toBe("THERAPY_COMPLETED");
  });
});
