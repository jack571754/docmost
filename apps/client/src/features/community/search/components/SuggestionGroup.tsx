import React from "react";
import { Group, Avatar, Text, Badge, Center } from "@mantine/core";
import { Spotlight } from "@mantine/spotlight";
import { Link } from "react-router-dom";
import { IconUsers } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { buildPageUrl } from "@/features/page/page.utils";
import { getPageIcon } from "@/lib";
import { ISuggestionResult } from "@/features/search/types/search.types";
import { getAvatarUrl } from "@/lib/config";
import { searchSpotlight } from "@/features/search/constants";

interface SuggestionGroupProps {
  suggestions: ISuggestionResult;
  onActionTrigger?: () => void;
}

export function SuggestionGroup({ suggestions, onActionTrigger }: SuggestionGroupProps) {
  const { t } = useTranslation();
  const { pages = [], users = [], groups = [] } = suggestions;

  const hasPages = pages && pages.length > 0;
  const hasUsers = users && users.length > 0;
  const hasGroups = groups && groups.length > 0;

  if (!hasPages && !hasUsers && !hasGroups) {
    return null;
  }

  const handleActionClick = () => {
    searchSpotlight.close();
    onActionTrigger?.();
  };

  return (
    <>
      {hasPages && (
        <Spotlight.ActionsGroup label={t("Suggested Pages")}>
          {pages.map((page) => {
            if (!page) return null;
            return (
              <Spotlight.Action
                key={`suggest-page-${page.id}`}
                component={Link}
                // @ts-ignore
                to={buildPageUrl(
                  page.space?.slug || "",
                  page.slugId,
                  page.title
                )}
                onClick={handleActionClick}
                style={{ userSelect: "none" }}
              >
                <Group wrap="nowrap" w="100%">
                  <Center>{getPageIcon(page?.icon)}</Center>
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>
                      {page.title}
                    </Text>
                    {page.space && (
                      <Badge variant="light" size="xs" color="gray">
                        {page.space.name}
                      </Badge>
                    )}
                  </div>
                </Group>
              </Spotlight.Action>
            );
          })}
        </Spotlight.ActionsGroup>
      )}

      {hasUsers && (
        <Spotlight.ActionsGroup label={t("Members")}>
          {users.map((user) => {
            if (!user) return null;
            return (
              <Spotlight.Action
                key={`suggest-user-${user.id}`}
                component="div"
                onClick={handleActionClick}
                style={{ userSelect: "none" }}
              >
                <Group wrap="nowrap" w="100%">
                  <Avatar
                    src={getAvatarUrl(user.avatarUrl || "")}
                    size="sm"
                    radius="xl"
                  />
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>
                      {user.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {user.email}
                    </Text>
                  </div>
                </Group>
              </Spotlight.Action>
            );
          })}
        </Spotlight.ActionsGroup>
      )}

      {hasGroups && (
        <Spotlight.ActionsGroup label={t("Groups")}>
          {groups.map((group) => {
            if (!group) return null;
            return (
              <Spotlight.Action
                key={`suggest-group-${group.id}`}
                component="div"
                onClick={handleActionClick}
                style={{ userSelect: "none" }}
              >
                <Group wrap="nowrap" w="100%">
                  <Center>
                    <IconUsers size={18} />
                  </Center>
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>
                      {group.name}
                    </Text>
                    {group.description && (
                      <Text size="xs" c="dimmed" truncate>
                        {group.description}
                      </Text>
                    )}
                  </div>
                </Group>
              </Spotlight.Action>
            );
          })}
        </Spotlight.ActionsGroup>
      )}
    </>
  );
}
