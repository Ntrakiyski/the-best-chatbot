import { useMemo } from "react";
import { usePreferences } from "./queries/use-preferences";

/**
 * Hook to get filtered OpenRouter models based on user preferences
 * Returns all OpenRouter models if no preferences are set (backward compatibility)
 */
export function useFilteredOpenRouterModels() {
  const { data: preferences } = usePreferences();

  const filteredModelIds = useMemo(() => {
    const selectedModels = preferences?.selectedOpenRouterModels;

    // If no models selected, return null to indicate "show all"
    if (!selectedModels || selectedModels.length === 0) {
      return null;
    }

    // Return Set for O(1) lookup performance
    return new Set(selectedModels);
  }, [preferences]);

  return filteredModelIds;
}
