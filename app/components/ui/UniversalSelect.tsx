import React from 'react';
import Select from 'react-select';
import type { Props as SelectProps, GroupBase } from 'react-select';

export type UniversalSelectOption = {
  value: string;
  label: string;
  [key: string]: any;
};

export type UniversalSelectProps<OptionType extends UniversalSelectOption = UniversalSelectOption> = Omit<
  SelectProps<OptionType, false, GroupBase<OptionType>>,
  'classNamePrefix'
> & {
  formatOptionLabel?: (option: OptionType, context: { context: 'menu' | 'value' }) => React.ReactNode;
  styles?: any;
};

const defaultStyles = {
  control: (base: any, state: any) => ({
    ...base,
    minHeight: '40px',
    height: '40px',
    borderRadius: '6px',
    borderColor: state.isFocused ? '#111827' : '#111827',
    boxShadow: state.isFocused ? '0 0 0 2px #374151' : 'none',
    fontSize: '16px',
    fontFamily: 'inherit',
    paddingLeft: '0.75rem',
    paddingRight: '0.75rem',
    backgroundColor: 'white',
    '&:hover': { borderColor: '#111827' },
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0',
    padding: '0',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected ? '#f3f4f6' : state.isFocused ? '#e0e7ff' : 'white',
    color: '#111827',
    padding: 12,
    cursor: 'pointer',
    fontSize: '16px',
    fontFamily: 'inherit',
  }),
  singleValue: (base: any) => ({ ...base, display: 'flex', alignItems: 'center', gap: 8, fontSize: '16px', fontFamily: 'inherit' }),
  menu: (base: any) => ({ ...base, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }),
  placeholder: (base: any) => ({ ...base, color: '#9ca3af', fontSize: '16px', fontFamily: 'inherit' }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base: any, state: any) => ({
    ...base,
    color: state.isFocused ? '#374151' : '#9ca3af',
    '&:hover': { color: '#374151' },
  }),
};

export default function UniversalSelect<OptionType extends UniversalSelectOption = UniversalSelectOption>({
  formatOptionLabel,
  styles,
  ...props
}: UniversalSelectProps<OptionType>) {
  const mergedStyles = styles
    ? { ...defaultStyles, ...styles }
    : defaultStyles;
  return (
    <Select
      classNamePrefix="react-select"
      styles={mergedStyles}
      formatOptionLabel={formatOptionLabel}
      {...props}
    />
  );
} 