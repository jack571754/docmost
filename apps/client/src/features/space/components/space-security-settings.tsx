import { ISpace } from "@/features/space/types/space.types.ts";

type SpaceSecuritySettingsProps = {
  space: ISpace;
  readOnly?: boolean;
};

export default function SpaceSecuritySettings({
  space: _space,
  readOnly: _readOnly,
}: SpaceSecuritySettingsProps) {
  return null;
}
