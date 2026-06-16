import { useSearchSuggestionsQuery } from "@/features/search/queries/search-query";
import { isSearchSuggestionsEnabled } from "@/lib/config";

interface UseSpotlightSuggestionsParams {
  query: string;
  spaceId?: string;
}

export function useSpotlightSuggestions({ query, spaceId }: UseSpotlightSuggestionsParams) {
  const isEnabled = isSearchSuggestionsEnabled();
  const trimmedQuery = query.trim();
  
  // Only query backend if suggestions are enabled AND query is at least 2 characters long
  const shouldFetch = isEnabled && trimmedQuery.length >= 2;

  const { data, isLoading } = useSearchSuggestionsQuery({
    query: shouldFetch ? trimmedQuery : "",
    includeUsers: true,
    includeGroups: true,
    includePages: true,
    spaceId,
    limit: 5,
  });

  return {
    suggestions: shouldFetch ? data : null,
    isLoading: shouldFetch ? isLoading : false,
    isEnabled,
  };
}
