"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import {
  AppState,
  AppAction,
  TailoringRun,
} from "@/types";

// ----------------------------------------------------------
// Initial State
// ----------------------------------------------------------
const initialState: AppState = {
  resume: null,
  jd: null,
  matchScore: null,
  tailoredResume: null,
  gaps: [],
  tailoringRun: null,
  status: "idle",
  errors: [],
  resumeRaw: "",
  jdRaw: "",
};

// ----------------------------------------------------------
// Reducer
// ----------------------------------------------------------
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_RESUME_RAW":
      return { ...state, resumeRaw: action.payload };

    case "SET_JD_RAW":
      return { ...state, jdRaw: action.payload };

    case "SET_STATUS":
      return { ...state, status: action.payload };

    case "SET_RUN": {
      // Support both bare TailoringRun and { run, status, errors } pipeline result
      const payload = action.payload;
      const isPipelineResult = "run" in payload && payload.run !== undefined;
      const run: TailoringRun = isPipelineResult
        ? (payload as { run: TailoringRun }).run
        : (payload as TailoringRun);
      const runStatus = isPipelineResult
        ? (payload as { status?: string }).status
        : undefined;
      const runErrors = isPipelineResult
        ? (payload as { errors?: string[] }).errors
        : undefined;
      return {
        ...state,
        tailoringRun: run,
        resume: run.resumeProfile,
        jd: run.jdProfile,
        matchScore: run.originalScore,
        tailoredResume: run.tailoredResume,
        gaps: run.gaps,
        status: runStatus === "partial" ? "partial" : "done",
        errors: runErrors ?? [],
      };
    }

    case "SET_ERRORS":
      return { ...state, errors: action.payload, status: "error" };

    case "CONFIRM_BULLET": {
      if (!state.tailoredResume) return state;
      const updatedExperience = state.tailoredResume.tailoredExperience.map(
        (exp, ei) => {
          if (ei !== action.payload.experienceIndex) return exp;
          return {
            ...exp,
            bullets: exp.bullets.map((bullet, bi) => {
              if (bi !== action.payload.bulletIndex) return bullet;
              return { ...bullet, confirmed: action.payload.confirmed };
            }),
          };
        }
      );
      const updatedTailored = {
        ...state.tailoredResume,
        tailoredExperience: updatedExperience,
      };
      const updatedRun = state.tailoringRun
        ? { ...state.tailoringRun, tailoredResume: updatedTailored }
        : null;
      return {
        ...state,
        tailoredResume: updatedTailored,
        tailoringRun: updatedRun,
      };
    }

    case "REVERT_BULLET": {
      if (!state.tailoredResume) return state;
      const updatedExperience = state.tailoredResume.tailoredExperience.map(
        (exp, ei) => {
          if (ei !== action.payload.experienceIndex) return exp;
          return {
            ...exp,
            bullets: exp.bullets.map((bullet, bi) => {
              if (bi !== action.payload.bulletIndex) return bullet;
              return { ...bullet, confirmed: false };
            }),
          };
        }
      );
      const updatedTailored = {
        ...state.tailoredResume,
        tailoredExperience: updatedExperience,
      };
      const updatedRun = state.tailoringRun
        ? { ...state.tailoringRun, tailoredResume: updatedTailored }
        : null;
      return {
        ...state,
        tailoredResume: updatedTailored,
        tailoringRun: updatedRun,
      };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// ----------------------------------------------------------
// Context
// ----------------------------------------------------------
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ----------------------------------------------------------
// Provider
// ----------------------------------------------------------
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// ----------------------------------------------------------
// Hook
// ----------------------------------------------------------
export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return ctx;
}

export { AppContext };
