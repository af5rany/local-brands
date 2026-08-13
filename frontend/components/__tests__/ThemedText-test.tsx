import * as React from "react";
import renderer from "react-test-renderer";

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColors: () => ({
    text: '#000',
    background: '#fff',
    primary: '#000',
  }),
}));

import { ThemedText } from "../ThemedText";

it(`renders correctly`, () => {
  const tree = renderer
    .create(<ThemedText>Snapshot test!</ThemedText>)
    .toJSON();

  expect(tree).toMatchSnapshot();
});
