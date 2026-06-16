import { Group, Text } from "@mantine/core";
import { Spotlight } from "@mantine/spotlight";
import { IconSearch } from "@tabler/icons-react";
import React, { useMemo, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { searchSpotlightStore } from "../constants.ts";
import { SearchSpotlightFilters } from "./search-spotlight-filters.tsx";
import { useUnifiedSearch } from "../hooks/use-unified-search.ts";
import { SearchResultItem } from "./search-result-item.tsx";
import { useSpotlightSuggestions } from "@/features/community/search/hooks/useSpotlightSuggestions";
import { SuggestionGroup } from "@/features/community/search/components/SuggestionGroup";

interface SearchSpotlightProps {
  spaceId?: string;
}

export function SearchSpotlight({ spaceId }: SearchSpotlightProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [debouncedSearchQuery] = useDebouncedValue(query, 300);
  const [filters, setFilters] = useState<{
    spaceId?: string | null;
    contentType?: string;
  }>({
    contentType: "page",
  });

  const searchParams = useMemo(() => {
    const params: any = {
      query: debouncedSearchQuery,
      contentType: filters.contentType || "page",
    };

    if (filters.spaceId) {
      params.spaceId = filters.spaceId;
    }

    return params;
  }, [debouncedSearchQuery, filters]);

  const { data: searchResults, isLoading } = useUnifiedSearch(
    searchParams,
    true,
  );

  const { suggestions, isEnabled: isSuggestionsEnabled } = useSpotlightSuggestions({
    query: debouncedSearchQuery,
    spaceId: filters.spaceId || undefined,
  });

  const resultItems = (searchResults || []).map((result) => (
    <SearchResultItem
      key={result.id}
      result={result}
      isAttachmentResult={false}
      showSpace={!filters.spaceId}
    />
  ));

  return (
    <Spotlight.Root
      size="xl"
      maxHeight={600}
      store={searchSpotlightStore}
      query={query}
      onQueryChange={setQuery}
      scrollable
      overlayProps={{
        backgroundOpacity: 0.55,
      }}
    >
      <Group gap="xs" px="sm" pt="sm" pb="xs">
        <Spotlight.Search
          placeholder={t("Search...")}
          leftSection={<IconSearch size={20} stroke={1.5} />}
          style={{ flex: 1 }}
        />
      </Group>

      <div
        style={{
          padding: "4px 16px",
        }}
      >
        <SearchSpotlightFilters
          onFiltersChange={setFilters}
          spaceId={spaceId}
        />
      </div>

      <Spotlight.ActionsList>
        {isSuggestionsEnabled && suggestions && (
          <SuggestionGroup suggestions={suggestions} />
        )}

        {query.length === 0 && resultItems.length === 0 && (
          <Spotlight.Empty>{t("Start typing to search...")}</Spotlight.Empty>
        )}

        {query.length > 0 && !isLoading && resultItems.length === 0 && (!suggestions || (!suggestions.pages?.length && !suggestions.users?.length && !suggestions.groups?.length)) && (
          <Spotlight.Empty>{t("No results found...")}</Spotlight.Empty>
        )}

        {resultItems.length > 0 && (
          <>
            {isSuggestionsEnabled && suggestions && (suggestions.pages?.length || suggestions.users?.length || suggestions.groups?.length) ? (
              <div style={{ padding: '8px 16px', borderTop: '1px solid var(--mantine-color-default-border)' }}>
                <Text size="xs" fw={700} c="dimmed">{t("Full Text Search Results")}</Text>
              </div>
            ) : null}
            {resultItems}
          </>
        )}
      </Spotlight.ActionsList>
    </Spotlight.Root>
  );
}
