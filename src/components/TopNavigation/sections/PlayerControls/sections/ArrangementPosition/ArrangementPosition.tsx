import { css } from "../../../../../../../styled-system/css";
import { Stack } from "../../../../../../../styled-system/jsx";

const inputStyle = css({
  width: "5ch",
  bg: {
    base: "gray.4",
    _hover: "gray.5",
    _active: "gray.3",
  },
  color: {
    base: "gray.11",
    _hover: "gray.12",
    _focus: "gray.12",
  },
  borderRadius: "4",
  py: 1,
  px: 2,
  textAlign: "right",
});

type Props = {};

const ArrangementPosition = (props: Props) => {
  return (
    <Stack flexDir="row" gap="0">
      <input
        className={inputStyle}
        value={1}
        style={{
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        }}
      />
      <input
        className={inputStyle}
        value={1}
        style={{
          borderRadius: 0,
        }}
      />
      <input
        className={inputStyle}
        value={1}
        style={{
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
        }}
      />
    </Stack>
  );
};

export default ArrangementPosition;
