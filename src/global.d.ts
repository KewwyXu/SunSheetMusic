import type { ItemType, MenuItemType } from "antd/es/menu/interface";

declare module "*.png" {
  const value: string;
  export default value;
}

export type GenericItemType<T = unknown> = T extends infer U extends
  MenuItemType
  ? unknown extends U
    ? ItemType
    : ItemType<U>
  : ItemType;
