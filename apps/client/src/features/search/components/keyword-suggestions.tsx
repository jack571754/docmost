import { Group, Text } from "@mantine/core";
import { Spotlight } from "@mantine/spotlight";
import { IconSearch } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { IKeywordSuggestion } from "@/features/search/types/search.types";

interface KeywordSuggestionsProps {
  suggestions: IKeywordSuggestion[];
  onPick: (keyword: string) => void;
}

export function KeywordSuggestions({
  suggestions,
  onPick,
}: KeywordSuggestionsProps) {
  const { t } = useTranslation();

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <Spotlight.ActionsGroup label={t("Search suggestions")}>
      {suggestions.map((s) => (
        <Spotlight.Action
          key={s.query}
          onClick={() => onPick(s.query)}
          leftSection={<IconSearch size={16} stroke={1.5} />}
          style={{ userSelect: "none" }}
        >
          <Group w="100%" justify="space-between" wrap="nowrap">
            <Text size="sm">{s.query}</Text>
            <Text size="xs" c="dimmed">
              {s.searchCount}
            </Text>
          </Group>
        </Spotlight.Action>
      ))}
    </Spotlight.ActionsGroup>
  );
}
