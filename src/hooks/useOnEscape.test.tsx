import { renderHook } from "@testing-library/react-hooks";
import userEvent from "@testing-library/user-event";

import { useOnEscape } from "./useOnEscape";

it("calls the callback when the escape key is pressed", () => {
  const onEscape = jest.fn();
  renderHook(() => useOnEscape(onEscape));
  userEvent.keyboard("{esc}");
  expect(onEscape).toHaveBeenCalled();
});
