import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import type { ButtonProps } from "../Button";
import Icon from "../Icon";

import type { ClassName, PropsWithSpread } from "types";

export const LOADER_MIN_DURATION = 400; // minimium duration (ms) loader displays
export const SUCCESS_DURATION = 2000; // duration (ms) success tick is displayed

export enum Label {
  WAITING = "Waiting for action to complete",
  SUCCESS = "Action completed",
}

export type Props = PropsWithSpread<
  {
    appearance?: ButtonProps["appearance"];
    children?: ReactNode;
    className?: ClassName;
    disabled?: boolean;
    inline?: boolean;
    loading?: boolean;
    success?: boolean;
  },
  ButtonHTMLAttributes<HTMLButtonElement>
>;

const ActionButton = ({
  appearance,
  children,
  className,
  disabled = false,
  inline = false,
  loading = false,
  success = false,
  ...buttonProps
}: Props): JSX.Element => {
  const [height, setHeight] = useState<number | null>();
  const [width, setWidth] = useState<number | null>();
  const [showLoader, setShowLoader] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let loaderTimeout: number;

    if (loading) {
      setIsInitialLoading(false);
      loaderTimeout = window.setTimeout(() => {
        setShowLoader(true);
      }, LOADER_MIN_DURATION);
    } else if (loading) {
      setShowLoader(true);
    }

    if (!loading) {
      window.clearTimeout(loaderTimeout);
      setShowLoader(false);
      if (success) {
        setShowSuccess(true);
      }
    }

    if (!loading && !showLoader) {
      setHeight(null);
      setWidth(null);
    }

    return () => window.clearTimeout(loaderTimeout);
  }, [loading, showLoader, success, isInitialLoading]);

  useEffect(() => {
    let successTimeout: number;

    if (showSuccess) {
      successTimeout = window.setTimeout(() => {
        setHeight(null);
        setWidth(null);
        setShowSuccess(false);
      }, SUCCESS_DURATION);
    }

    return () => window.clearTimeout(successTimeout);
  }, [showSuccess]);

  const buttonClasses = classNames(
    className,
    "p-action-button",
    appearance ? `p-button--${appearance}` : "p-button",
    {
      "is-processing": showLoader || showSuccess,
      "is-disabled": disabled,
      "is-inline": inline,
    }
  );
  const showIcon = showLoader || showSuccess;
  const icon = (showLoader && "spinner") || (showSuccess && "success") || null;
  const iconLight = appearance === "positive" || appearance === "negative";

  return (
    <button
      className={buttonClasses}
      disabled={disabled}
      ref={ref}
      style={
        height && width
          ? {
              height: `${height}px`,
              width: `${width}px`,
            }
          : undefined
      }
      {...buttonProps}
    >
      {showIcon ? (
        <Icon
          aria-label={showLoader ? Label.WAITING : Label.SUCCESS}
          className={showLoader ? "u-animation--spin" : null}
          light={iconLight}
          name={icon}
        />
      ) : (
        children
      )}
    </button>
  );
};

export default ActionButton;
