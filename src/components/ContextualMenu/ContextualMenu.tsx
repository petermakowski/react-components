import classNames from "classnames";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { HTMLProps } from "react";

import { useListener, useOnEscapePressed, usePrevious } from "hooks";
import Button from "../Button";
import type { ButtonProps } from "../Button";
import ContextualMenuDropdown from "./ContextualMenuDropdown";
import type { ContextualMenuDropdownProps } from "./ContextualMenuDropdown";
import type { MenuLink, Position } from "./ContextualMenuDropdown";
import { ClassName, PropsWithSpread, SubComponentProps } from "types";
import { useId } from "hooks/useId";
import { useOnClickOutside } from "hooks/useOnClickOutside";

export enum Label {
  Toggle = "Toggle menu",
}

/**
 * The props for the ContextualMenu component.
 * @template L - The type of the link props.
 */
export type Props<L> = PropsWithSpread<
  {
    /**
     * Whether the menu should adjust its horizontal position to fit on the screen.
     */
    autoAdjust?: boolean;
    /**
     * The menu content (if the links prop is not supplied).
     */
    children?: ContextualMenuDropdownProps["dropdownContent"];
    /**
     * An optional class to apply to the wrapping element.
     */
    className?: ClassName;
    /**
     * Whether the menu should close when the escape key is pressed.
     */
    closeOnEsc?: boolean;
    /**
     * Whether the menu should close when clicking outside the menu.
     */
    closeOnOutsideClick?: boolean;
    /**
     * Whether the menu's width should match the toggle's width.
     */
    constrainPanelWidth?: boolean;
    /**
     * An optional class to apply to the dropdown.
     */
    dropdownClassName?: string | null;
    /**
     * Additional props to pass to the dropdown.
     */
    dropdownProps?: SubComponentProps<ContextualMenuDropdownProps>;
    /**
     * Whether the toggle should display a chevron icon.
     */
    hasToggleIcon?: boolean;
    /**
     * A list of links to display in the menu (if the children prop is not supplied.)
     */
    links?: MenuLink<L>[] | null;
    /**
     * A function to call when the menu is toggled.
     */
    onToggleMenu?: (isOpen: boolean) => void | null;
    /**
     * The horizontal position of the menu.
     */
    position?: Position | null;
    /**
     * An element to make the menu relative to.
     */
    positionNode?: HTMLElement | null;
    /**
     * Whether the dropdown should scroll if it is too long to fit on the screen.
     */
    scrollOverflow?: boolean;
    /**
     * The appearance of the toggle button.
     */
    toggleAppearance?: ButtonProps["appearance"] | null;
    /**
     * A class to apply to the toggle button.
     */
    toggleClassName?: string | null;
    /**
     * Whether the toggle button should be disabled.
     */
    toggleDisabled?: boolean;
    /**
     * The toggle button's label.
     */
    toggleLabel?: React.ReactNode | null;
    /**
     * Whether the toggle lable or icon should appear first.
     */
    toggleLabelFirst?: boolean;
    /**
     * Additional props to pass to the toggle button.
     */
    toggleProps?: SubComponentProps<ButtonProps>;
    /**
     * Whether the menu should be visible.
     */
    visible?: boolean;
  },
  HTMLProps<HTMLSpanElement>
>;

/**
 * Get the node to use for positioning the menu.
 * @param wrapper - The component's wrapping element.
 * @param positionNode - A positioning node, if supplied.
 * @return A node or null.
 */
const getPositionNode = (
  wrapper: HTMLElement,
  positionNode?: HTMLElement
): HTMLElement | null => {
  if (positionNode) {
    return positionNode;
  } else if (wrapper) {
    // We want to position the menu in relation to the toggle, if it exists.
    const toggle = wrapper.querySelector<HTMLElement>(
      ".p-contextual-menu__toggle"
    );
    return toggle || wrapper;
  }
  return null;
};

/**
 * Whether the positioning node is visible.
 * @param positionNode - The node that is used to position the menu.
 * @return Whether the positioning node is visible.
 */
const getPositionNodeVisible = (positionNode: HTMLElement) => {
  return !positionNode || positionNode.offsetParent !== null;
};

/**
 * A component for the Vanilla contextual menu.
 * @template L - The type of the link props.
 * @param [autoAdjust=true] - Whether the menu should adjust to fit in the screen.
 * @param children - The menu content (if the links prop is not supplied).
 * @param className - An optional class to apply to the wrapping element.
 * @param [closeOnEsc=true] - Whether the menu should close when the escape key is pressed.
 * @param [closeOnOutsideClick=true] - Whether the menu should close when clicking outside the menu.
 * @param constrainPanelWidth - Whether the menu's width should match the toggle's width.
 * @param dropdownClassName - An optional class to apply to the dropdown.
 * @param hasToggleIcon - Whether the toggle should display a chevron icon.
 * @param links - A list of links to display in the menu (if the children prop is not supplied.)
 * @param onToggleMenu - A function to call when the menu is toggled.
 * @param [position="right"] - The position of the menu.
 * @param positionNode - An element to make the menu relative to.
 * @param toggleAppearance - The appearance of the toggle button.
 * @param toggleClassName - An class to apply to the toggle button.
 * @param toggleDisabled - Whether the toggle button should be disabled.
 * @param toggleLabel - The toggle button's label.
 * @param [toggleLabelFirst=true] - Whether the toggle lable or icon should appear first.
 * @param [visible=false] - Whether the menu should be visible.
 */
const ContextualMenu = <L,>({
  autoAdjust = true,
  children,
  className,
  closeOnEsc = true,
  closeOnOutsideClick = true,
  constrainPanelWidth,
  dropdownClassName,
  dropdownProps,
  hasToggleIcon,
  links,
  onToggleMenu,
  position = "right",
  positionNode,
  scrollOverflow,
  toggleAppearance,
  toggleClassName,
  toggleDisabled,
  toggleLabel,
  toggleLabelFirst = true,
  toggleProps,
  visible = false,
  ...wrapperProps
}: Props<L>): JSX.Element => {
  const id = useId();
  const wrapper = useRef<HTMLDivElement | null>(null);
  const [positionCoords, setPositionCoords] = useState<DOMRect>();
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const hasToggle = hasToggleIcon || toggleLabel;

  useEffect(() => {
    setAdjustedPosition(position);
  }, [position, autoAdjust]);

  // Update the coordinates of the position node.
  const updatePositionCoords = useCallback(() => {
    const parent = getPositionNode(wrapper.current, positionNode);
    if (!parent) {
      return null;
    }
    setPositionCoords(parent.getBoundingClientRect());
  }, [wrapper, positionNode]);

  const [isOpen, setIsOpen] = useState(visible);
  const handleOpen = useCallback(() => {
    // Call the toggle callback, if supplied.
    onToggleMenu && onToggleMenu(true);
    // When the menu opens then update the coordinates of the parent.
    updatePositionCoords();
    setIsOpen(true);
  }, [onToggleMenu, updatePositionCoords]);
  const handleClose = useCallback(() => {
    // Call the toggle callback, if supplied.
    onToggleMenu && onToggleMenu(false);
    setIsOpen(false);
  }, [onToggleMenu]);

  const previousVisible = usePrevious(visible);
  const labelNode =
    toggleLabel && typeof toggleLabel === "string" ? (
      <span>{toggleLabel}</span>
    ) : React.isValidElement(toggleLabel) ? (
      toggleLabel
    ) : null;
  const wrapperClass = classNames(className, "p-contextual-menu", {
    [`p-contextual-menu--${adjustedPosition}`]: adjustedPosition !== "right",
  });

  // Update the coordinates of the wrapper once it mounts to the dom. This uses
  // The callback ref pattern:
  // https://reactjs.org/docs/hooks-faq.html#how-can-i-measure-a-dom-node
  const wrapperRef = useCallback(
    (node) => {
      wrapper.current = node;
      if (node !== null) {
        updatePositionCoords();
      }
    },
    [updatePositionCoords]
  );

  // Handle controlling updates to the menu visibility from outside
  // the component.
  useEffect(() => {
    if (visible !== previousVisible) {
      if (visible && !isOpen) {
        handleOpen();
      } else if (!visible && isOpen) {
        handleClose();
      }
    }
  }, [handleClose, handleOpen, visible, isOpen, previousVisible]);

  useOnClickOutside(wrapper, handleClose, {
    isEnabled: closeOnOutsideClick,
  });
  useOnEscapePressed(handleClose, { isEnabled: closeOnEsc });

  const onResize = useCallback(() => {
    const parent = getPositionNode(wrapper.current, positionNode);
    if (parent && !getPositionNodeVisible(parent)) {
      // Hide the menu if the item has become hidden. This might happen in
      // a responsive table when columns become hidden as the page
      // becomes smaller.
      handleClose();
    } else {
      // Update the coordinates so that the menu stays relative to the
      // toggle button.
      updatePositionCoords();
    }
  }, [handleClose, positionNode, updatePositionCoords]);

  useListener(window, onResize, "resize", true, isOpen);

  return (
    <span className={wrapperClass} ref={wrapperRef} {...wrapperProps}>
      {hasToggle ? (
        <Button
          appearance={toggleAppearance}
          aria-controls={id}
          aria-expanded={isOpen ? "true" : "false"}
          aria-label={toggleLabel ? null : Label.Toggle}
          aria-pressed={isOpen ? "true" : "false"}
          aria-haspopup="true"
          className={classNames("p-contextual-menu__toggle", toggleClassName)}
          disabled={toggleDisabled}
          hasIcon={hasToggleIcon}
          onClick={() => {
            if (!isOpen) {
              handleOpen();
            } else {
              handleClose();
            }
          }}
          type="button"
          {...toggleProps}
        >
          {toggleLabelFirst ? labelNode : null}
          {hasToggleIcon ? (
            <i
              className={classNames(
                "p-icon--chevron-down p-contextual-menu__indicator",
                {
                  "is-light": ["negative", "positive"].includes(
                    toggleAppearance
                  ),
                }
              )}
            ></i>
          ) : null}
          {toggleLabelFirst ? null : labelNode}
        </Button>
      ) : null}
      {isOpen && (
        <ContextualMenuDropdown<L>
          adjustedPosition={adjustedPosition}
          autoAdjust={autoAdjust}
          handleClose={handleClose}
          constrainPanelWidth={constrainPanelWidth}
          dropdownClassName={dropdownClassName}
          dropdownContent={children}
          id={id}
          isOpen={isOpen}
          links={links}
          position={position}
          positionCoords={positionCoords}
          positionNode={getPositionNode(wrapper.current)}
          scrollOverflow={scrollOverflow}
          setAdjustedPosition={setAdjustedPosition}
          {...dropdownProps}
        />
      )}
    </span>
  );
};

export default ContextualMenu;
