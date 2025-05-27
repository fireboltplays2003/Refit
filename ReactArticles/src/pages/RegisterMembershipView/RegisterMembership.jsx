export default function RegisterMembership() {
    return (
        <div>
             <form>
                <div>
                    <label>
                        Membership Type:
                    </label>
                    <input type="text" />
                </div>
                <div>
                    <label>
                       Start Date:
                    </label>
                    <input type="text" />
                </div>
                <div>
                    <label>
                        End Date:
                    </label>
                    <input type="date" />
                </div>
                
             </form>
        </div>
    );
}