"use client";
import React from "react";
import BookThietKeBocTachPage from "./BookThietKeBocTach/src/BookThietKeBocTachPage";

interface BookThietKeBocTachProps {
  sidebarCollapsed?: boolean;
}

export default function BookThietKeBocTach({
  sidebarCollapsed = false,
}: BookThietKeBocTachProps): React.ReactElement {
  return <BookThietKeBocTachPage mainSidebarCollapsed={sidebarCollapsed} />;
}
