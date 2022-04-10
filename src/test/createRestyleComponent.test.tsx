import React from 'react';
import {create as render, act} from 'react-test-renderer';
import {View, Dimensions, ViewProps} from 'react-native';

import createRestyleComponent from '../createRestyleComponent';
import {
  backgroundColor,
  BackgroundColorProps,
  SpacingProps,
  spacing,
  OpacityProps,
  opacity,
} from '../restyleFunctions';
import {ThemeProvider} from '../context';
import createVariant, {VariantProps} from '../createVariant';

const theme = {
  colors: {
    coral: '#FFE6E4',
    lightcyan: '#E0FFFF',
    lightpink: '#FFB6C1',
  },
  spacing: {
    s: 8,
  },
  breakpoints: {
    phone: 0,
    tablet: 376,
  },
  opacities: {
    barelyVisible: 0.1,
    almostOpaque: 0.9,
  },
};
const themeWithVariant = {
  ...theme,
  cardVariants: {
    defaults: {
      alignItems: 'flex-start',
      backgroundColor: 'lightpink',
    },
    regular: {
      alignItems: 'center',
      backgroundColor: 'lightcyan',
    },
  },
};
type Theme = typeof theme;
type ThemeWithVariant = typeof themeWithVariant;

jest.mock('react-native/Libraries/Utilities/Dimensions', () => {
  return {
    get: () => ({
      width: 375,
      height: 667,
    }),
    addEventListener: jest.fn(),
  };
});

const Component = createRestyleComponent<
  BackgroundColorProps<Theme> &
    SpacingProps<Theme> &
    OpacityProps<Theme> &
    ViewProps,
  Theme
>([backgroundColor, spacing, opacity]);
const cardVariant = createVariant<ThemeWithVariant, 'cardVariants'>({
  themeKey: 'cardVariants',
});
const ComponentWithVariant = createRestyleComponent<
  BackgroundColorProps<ThemeWithVariant> &
    SpacingProps<ThemeWithVariant> &
    OpacityProps<ThemeWithVariant> &
    VariantProps<ThemeWithVariant, 'cardVariants'> &
    ViewProps,
  ThemeWithVariant
>([backgroundColor, spacing, opacity, cardVariant]);

describe('createRestyleComponent', () => {
  describe('creates a component that', () => {
    beforeEach(() => {
      (Dimensions.addEventListener as jest.Mock).mockClear();
    });

    it('passes styles based on the given props', () => {
      const {root} = render(
        <ThemeProvider theme={theme}>
          <Component opacity={0.5} />
        </ThemeProvider>,
      );
      expect(root.findByType(View).props.style).toStrictEqual([{opacity: 0.5}]);
    });

    it('appends style prop to the end', () => {
      const {root} = render(
        <ThemeProvider theme={theme}>
          <Component opacity={0.5} style={{width: 100}} />
        </ThemeProvider>,
      );
      expect(root.findByType(View).props.style).toStrictEqual([
        {opacity: 0.5},
        {width: 100},
      ]);
    });

    it('does not pass styling properties to the child', () => {
      const {root} = render(
        <ThemeProvider theme={theme}>
          <Component opacity={0.5} pointerEvents="auto" />
        </ThemeProvider>,
      );
      expect(root.findByType(View).props).toStrictEqual({
        style: [{opacity: 0.5}],
        pointerEvents: 'auto',
      });
    });

    it('picks up values from the theme provided with ThemeProvider', () => {
      const {root} = render(
        <ThemeProvider theme={theme}>
          <Component backgroundColor="coral" />
        </ThemeProvider>,
      );
      expect(root.findByType(View).props).toStrictEqual({
        style: [{backgroundColor: '#FFE6E4'}],
      });
    });

    it('re-renders with styles specific to the screen size when dimensions change', async () => {
      (Dimensions.addEventListener as jest.Mock).mockClear();
      const {root} = render(
        <ThemeProvider theme={theme}>
          <Component opacity={{phone: 0.5, tablet: 0.8}} />
        </ThemeProvider>,
      );
      expect(root.findByType(View).props).toStrictEqual({
        style: [{opacity: 0.5}],
      });
      await new Promise(resolve => setTimeout(resolve, 0));
      const {calls} = (Dimensions.addEventListener as jest.Mock).mock;
      const onChange = calls[calls.length - 1][1];
      act(() => {
        onChange({window: {width: 768, height: 1024}});
      });
      expect(root.findByType(View).props).toStrictEqual({
        style: [{opacity: 0.8}],
      });
    });

    it('forwards refs', () => {
      const spy = jest.fn();
      render(
        <ThemeProvider theme={theme}>
          <Component ref={spy} testID="RENDERED_COMPONENT" />
        </ThemeProvider>,
      );

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({testID: 'RENDERED_COMPONENT'}),
        }),
      );
    });

    it('passes styles form default variant when no variant prop is defined', () => {
      const {root} = render(
        <ThemeProvider theme={themeWithVariant}>
          <ComponentWithVariant margin="s" />
        </ThemeProvider>,
      );
      expect(root.findByType(View).props.style).toStrictEqual([
        {
          alignItems: 'flex-start',
          backgroundColor: '#FFB6C1',
          margin: 8,
        },
      ]);
    });

    it('passes styles form the defined variant', () => {
      const {root} = render(
        <ThemeProvider theme={themeWithVariant}>
          <ComponentWithVariant variant="regular" margin="s" />
        </ThemeProvider>,
      );
      expect(root.findByType(View).props.style).toStrictEqual([
        {
          alignItems: 'center',
          backgroundColor: '#E0FFFF',
          margin: 8,
        },
      ]);
    });
  });
});
