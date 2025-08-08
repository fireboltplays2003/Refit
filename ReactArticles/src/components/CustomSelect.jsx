import React from "react";
import Select from "react-select";

const customStyles = {
    control: (provided, state) => ({
      ...provided,
      width: 270,
      height: 48,
      paddingLeft: 19,
      paddingRight: 19,
      backgroundColor: "#20232a",
      borderColor: state.isFocused ? "#5BBAFF" : "#333",
      borderRadius: 13,
      boxShadow: state.isFocused ? "0 0 0 2px #5BBAFF" : "none",
      cursor: "pointer",
      fontWeight: 500,
      fontSize: "1.25rem",
      color: "#eee",
      "&:hover": {
        borderColor: "#5BBAFF",
      },
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: 48,
      paddingTop: 0,
      paddingBottom: 0,
      display: "flex",
      alignItems: "center",
    }),
    input: (provided) => ({
      ...provided,
      margin: 0,
      padding: 0,
      height: "auto",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#5BBAFF",
      fontSize: "1.25rem",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#5BBAFF",
      fontWeight: 500,
      fontSize: "1.25rem",
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "#232427",
      borderRadius: 10,
      marginTop: 4,
      zIndex: 9999,
      maxHeight: 200,
      overflowY: "auto",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#5BBAFF" : "transparent",
      color: state.isFocused ? "#232427" : "#eee",
      cursor: "pointer",
      padding: "8px 12px",
    }),
    dropdownIndicator: (provided, state) => ({
      ...provided,
      color: state.isFocused ? "#5BBAFF" : "#888",
      "&:hover": {
        color: "#5BBAFF",
      },
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: "#888",
      "&:hover": {
        color: "#5BBAFF",
      },
    }),
  };
  

export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  isClearable = true,
  maxMenuHeight = 200,
  ...props
}) {
  const selectedOption = options.find((opt) => opt.value === value) || null;

  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={(option) => onChange(option ? option.value : "")}
      placeholder={placeholder}
      isClearable={isClearable}
      maxMenuHeight={maxMenuHeight}
      styles={customStyles}
      {...props}
    />
  );
}
