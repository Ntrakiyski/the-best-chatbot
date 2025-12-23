"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, AlertCircle, ListFilter } from "lucide-react";
import useSWR from "swr";
import { Button } from "ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "ui/command";
import { Skeleton } from "ui/skeleton";
import { Label } from "ui/label";
import { cn, fetcher } from "lib/utils";
import { toast } from "sonner";
import { OpenRouterModelDisplay } from "@/types/openrouter";
import { fetchOpenRouterModels } from "@/app/actions/openrouter";
import { UserPreferences } from "@/types/user";

export function OpenRouterConfigContent() {
  const t = useTranslations();
  const { data: preferences, mutate: mutatePreferences } =
    useSWR<UserPreferences>("/api/user/preferences", fetcher, {
      revalidateOnFocus: false,
    });

  const [models, setModels] = useState<OpenRouterModelDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Load models from API
  useEffect(() => {
    const loadModels = async () => {
      setLoading(true);
      setError(null);

      const result = await fetchOpenRouterModels();

      if (result.success && result.models) {
        setModels(result.models);
      } else {
        setError(result.error || "Failed to load models");
      }

      setLoading(false);
    };

    loadModels();
  }, []);

  // Load selected models from preferences
  useEffect(() => {
    if (preferences?.selectedOpenRouterModels) {
      setSelectedModels(new Set(preferences.selectedOpenRouterModels));
    }
  }, [preferences]);

  const handleToggleModel = (modelId: string) => {
    setSelectedModels((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) {
        next.delete(modelId);
      } else {
        next.add(modelId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedModels(new Set(models.map((m) => m.id)));
  };

  const handleClearAll = () => {
    setSelectedModels(new Set());
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...preferences,
          selectedOpenRouterModels: Array.from(selectedModels),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      // Revalidate preferences cache
      mutatePreferences();

      toast.success(
        t("Chat.OpenRouterConfig.preferencesSaved", {
          defaultValue: "OpenRouter preferences saved successfully",
        }),
      );
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error(
        t("Chat.OpenRouterConfig.failedToSavePreferences", {
          defaultValue: "Failed to save preferences. Please try again.",
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const groupedModels = models.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<string, OpenRouterModelDisplay[]>,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ListFilter className="h-5 w-5 text-primary" />
          <Label className="text-xl font-semibold">
            {t("Chat.OpenRouterConfig.title", {
              defaultValue: "OpenRouter Configuration",
            })}
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("Chat.OpenRouterConfig.description", {
            defaultValue:
              "Select which OpenRouter models you want to see in the chat interface. Only selected models will appear in the model dropdown. If no models are selected, all OpenRouter models will be available.",
          })}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center gap-2 bg-destructive/10 p-4 rounded-lg border border-destructive/20">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-destructive font-medium">
              {t("Chat.OpenRouterConfig.errorLoading", {
                defaultValue: "Error loading models",
              })}
            </p>
            <p className="text-xs text-destructive/80 mt-1">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            {t("Chat.OpenRouterConfig.retry", { defaultValue: "Retry" })}
          </Button>
        </div>
      )}

      {/* Model Selection */}
      {!loading && !error && models.length > 0 && (
        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={selectedModels.size === models.length}
              >
                {t("Chat.OpenRouterConfig.selectAll", {
                  defaultValue: "Select All",
                })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={selectedModels.size === 0}
              >
                {t("Chat.OpenRouterConfig.clearAll", {
                  defaultValue: "Clear All",
                })}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("Chat.OpenRouterConfig.selectedCount", {
                defaultValue: "{count} selected",
                values: { count: selectedModels.size },
              })}
            </p>
          </div>

          {/* Model List */}
          <div className="border rounded-lg">
            <Command className="rounded-lg">
              <CommandInput
                placeholder={t("Chat.OpenRouterConfig.searchPlaceholder", {
                  defaultValue: "Search models by name or provider...",
                })}
              />
              <CommandList className="max-h-[400px]">
                <CommandEmpty>
                  {t("Chat.OpenRouterConfig.noModelsFound", {
                    defaultValue: "No models found.",
                  })}
                </CommandEmpty>

                {Object.entries(groupedModels).map(
                  ([provider, providerModels]) => (
                    <CommandGroup
                      key={provider}
                      heading={provider.toUpperCase()}
                    >
                      {providerModels.map((model) => {
                        const isSelected = selectedModels.has(model.id);
                        return (
                          <CommandItem
                            key={model.id}
                            value={`${model.id} ${model.name} ${model.provider}`}
                            onSelect={() => handleToggleModel(model.id)}
                            className="cursor-pointer"
                          >
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible",
                              )}
                            >
                              <Check className="h-3 w-3" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">
                                  {model.name}
                                </p>
                                {model.supportsImages && (
                                  <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                    Vision
                                  </span>
                                )}
                              </div>
                              {model.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {model.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  Context:{" "}
                                  {model.contextLength.toLocaleString()}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Prompt: ${model.pricing.prompt} | Completion:
                                  ${model.pricing.completion}
                                </span>
                              </div>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  ),
                )}
              </CommandList>
            </Command>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("Chat.OpenRouterConfig.savePreferences", {
                defaultValue: "Save Preferences",
              })}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
