import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StepEditor } from '../components/create-steps/StepEditor';
import type { StepFormItem } from '../components/create-steps/StepEditor';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

const baseStep: StepFormItem = {
  id: 's1',
  description: 'Boil water',
  timestamp: '',
  isExpanded: false,
};

const noop = () => {};

describe('StepEditor', () => {
  it('renders the step number', () => {
    const { getByText } = render(
      <StepEditor step={baseStep} stepNumber={3} onUpdate={noop} onDelete={noop} canDelete={false} />
    );
    expect(getByText('3')).toBeTruthy();
  });

  it('renders collapsed preview text when not expanded', () => {
    const { getByText } = render(
      <StepEditor step={baseStep} stepNumber={1} onUpdate={noop} onDelete={noop} canDelete={false} />
    );
    expect(getByText('Boil water')).toBeTruthy();
  });

  it('does not show DESCRIPTION label when collapsed', () => {
    const { queryByText } = render(
      <StepEditor step={baseStep} stepNumber={1} onUpdate={noop} onDelete={noop} canDelete={false} />
    );
    expect(queryByText('DESCRIPTION')).toBeNull();
  });

  it('shows DESCRIPTION label after tapping header to expand', () => {
    const onUpdate = jest.fn((updated: StepFormItem) => updated);
    const { getByText, rerender } = render(
      <StepEditor step={baseStep} stepNumber={1} onUpdate={onUpdate} onDelete={noop} canDelete={false} />
    );
    fireEvent.press(getByText('Boil water'));
    const updatedStep = onUpdate.mock.calls[0][0];
    rerender(
      <StepEditor step={updatedStep} stepNumber={1} onUpdate={onUpdate} onDelete={noop} canDelete={false} />
    );
    expect(getByText('DESCRIPTION')).toBeTruthy();
  });

  it('shows DESCRIPTION and TIMESTAMP labels when expanded', () => {
    const expandedStep = { ...baseStep, isExpanded: true };
    const { getByText } = render(
      <StepEditor step={expandedStep} stepNumber={1} onUpdate={noop} onDelete={noop} canDelete={false} />
    );
    expect(getByText('DESCRIPTION')).toBeTruthy();
    expect(getByText('TIMESTAMP')).toBeTruthy();
  });

  it('shows description error text when errors.description is set', () => {
    const expandedStep = { ...baseStep, isExpanded: true };
    const { getByText } = render(
      <StepEditor
        step={expandedStep}
        stepNumber={1}
        onUpdate={noop}
        onDelete={noop}
        canDelete={false}
        errors={{ description: 'Description is required' }}
      />
    );
    expect(getByText('Description is required')).toBeTruthy();
  });

  it('shows timestamp error text when errors.timestamp is set', () => {
    const expandedStep = { ...baseStep, isExpanded: true };
    const { getByText } = render(
      <StepEditor
        step={expandedStep}
        stepNumber={1}
        onUpdate={noop}
        onDelete={noop}
        canDelete={false}
        errors={{ timestamp: 'Use MM:SS format (e.g. 01:30)' }}
      />
    );
    expect(getByText('Use MM:SS format (e.g. 01:30)')).toBeTruthy();
  });

  it('does not show delete button when canDelete is false', () => {
    const expandedStep = { ...baseStep, isExpanded: true };
    const { queryByTestId } = render(
      <StepEditor step={expandedStep} stepNumber={1} onUpdate={noop} onDelete={noop} canDelete={false} />
    );
    // The delete button contains a trash icon — canDelete=false means it's not rendered
    // We verify by checking that onDelete is never reachable via UI
    expect(queryByTestId('delete-step')).toBeNull();
  });
});
