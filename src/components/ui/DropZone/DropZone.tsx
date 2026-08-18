import { useDroppable } from "@dnd-kit/core";
import { cva } from "../../../../styled-system/css";
import { Stack } from "../../../../styled-system/jsx";

const styles = cva({
  base: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    px: 10,
    py: 6,

    borderRadius: 6,
    bg: "gray.2",
    borderColor: "gray.3",
    borderWidth: "1.5px",
    borderStyle: "solid",

    color: "gray.8",
    fontFamily: "mono",

    _motionSafe: {
      transitionProperty: "background-color, color, border-color",
      transitionTimingFunction: "ease-in-out",
      transitionDuration: "fast",
    },

    "& > div": {
      scale: 1,

      _motionSafe: {
        transitionProperty: "scale",
        transitionTimingFunction: "ease-in-out",
        transitionDuration: "fast",
      },
    },
  },

  variants: {
    over: {
      true: {
        bg: "blue.2",
        borderColor: "blue.3",
        color: "blue.10",

        "& > div": {
          scale: 1.1,
        },
      },
    },
  },
});

type DropZoneProps = {
  id: string;
  data: any;
  text?: string;
  icon?: React.ReactElement;
};
const DropZone = ({ id, data, text, icon }: DropZoneProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data,
  });
  return (
    <div ref={setNodeRef} className={styles({ over: isOver })}>
      <Stack align="center">
        {icon}
        <span>{text ?? "Drop zone"}</span>
      </Stack>
    </div>
  );
};

export default DropZone;
