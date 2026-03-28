import React from "react";
import { Autocomplete, Checkbox, TextField } from "@mui/material";

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Search...",
  label,
  multiple = false,
  disabled = false,
  fullWidth = true,
  noOptionsText = "No options",
}) {
  const selectedValue = multiple
    ? options.filter((option) => (value || []).includes(option.value))
    : options.find((option) => option.value === value) || null;

  return (
    <Autocomplete
      multiple={multiple}
      disableCloseOnSelect={multiple}
      options={options}
      value={selectedValue}
      disabled={disabled}
      onChange={(_, newValue) => {
        if (multiple) {
          onChange(newValue.map((option) => option.value));
        } else {
          onChange(newValue ? newValue.value : "");
        }
      }}
      isOptionEqualToValue={(option, selected) =>
        option.value === selected.value
      }
      getOptionLabel={(option) => option.label || ""}
      noOptionsText={noOptionsText}
      renderOption={(props, option, { selected }) => (
        <li {...props} key={option.value}>
          {multiple && <Checkbox sx={{ mr: 1 }} checked={selected} />}
          {option.label}
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          {...(label ? { label } : {})}
          placeholder={placeholder}
        />
      )}
      fullWidth={fullWidth}
      size="small"
    />
  );
}
