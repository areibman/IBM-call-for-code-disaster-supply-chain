import styled from "styled-components";
import { darken } from "polished";

export const darkenColor = color => {
  return darken(0.05, color);
};

export const ItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid rebeccapurple;
  border-radius: 4px;
  margin-bottom: 10px;
  padding: 10px;
`;

export const ItemLabel = styled.div`
  width: 100%;
  font-weight: bold;
  margin-bottom: 5px;
`;

export const LabeledInfo = styled.span`
  font-weight: normal;
`;

export const ItemButton = styled.button.attrs({
  type: "button"
})`
  width: 125px;
  height: 45px;
  padding: 8px;
  margin-right: 5px;
  border-radius: 4px;
  background-color: #339966;
  color: white;
  :hover {
    background-color: ${darkenColor("#339966")};
  }
`;

export const Input = styled.input`
  width: 100%;
  margin: 5px 0px;
  padding: 12px 20px;
  display: inline-block;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
`;

export const Form = styled.form`
  margin-top: 12px;
`;

export const Panel = styled.div`
  width: 100%;
`;

export const Title = styled.span`
  width: 100%;
  font-size: 1.5em;
  font-weight: bold;
`;

export const FormPanel = styled(Panel)``;

export const PanelTitle = styled(Title)``;

export const Buttons = styled.div`
  display: flex;
`;
